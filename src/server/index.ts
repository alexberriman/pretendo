import express, { Express, Request, Response, RequestHandler } from "express";
import http from "http";
import {
  ApiConfig,
  DatabaseService,
  Result,
  Server,
  err,
  ok,
} from "../types/index.js";
import {
  createCorsMiddleware,
  AuthService,
  createAuthMiddleware,
  createAuthorizationMiddleware,
  createErrorSimulationMiddleware,
  createLatencyMiddleware,
  errorHandlerMiddleware,
  createLoggerMiddleware,
  logManager,
} from "./middleware/index.js";
import { logger } from "../utils/debug-logger.js";
import { createRoutes } from "./routes/index.js";

export const createServer = (
  config: ApiConfig,
  database: DatabaseService,
): Server => {
  const options = config.options || {};
  let httpServer: http.Server | null = null;
  let port = options.port || 3000;
  let host = options.host || "localhost";

  // Create Express app
  const app: Express = express();

  // Remove the "X-Powered-By: Express" header and add custom header
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Powered-By", "Pretendo");
    next();
  });

  // Initialize authentication service
  const authService = new AuthService(options);

  // Configure server
  const initializeServer = (): Express => {
    // Add logging middleware
    app.use(createLoggerMiddleware(options));

    // Add CORS middleware
    app.use(createCorsMiddleware(options));

    // Add JSON body parser
    app.use(express.json());

    // Add latency simulation middleware
    app.use(createLatencyMiddleware(options));

    // Add error simulation middleware
    app.use(createErrorSimulationMiddleware(options));

    // Add database and apiConfig to request object for middleware - this must be before auth middleware
    app.use((req, res, next) => {
      // Use unknown cast first to avoid TypeScript errors
      (req as unknown as { db: DatabaseService }).db = database;
      (req as unknown as { apiConfig: ApiConfig }).apiConfig = config;
      next();
    });

    // Add authentication middleware
    app.use(createAuthMiddleware(authService, options));

    // Add authorization middleware - use execute to return the function
    const authorizationMiddleware = createAuthorizationMiddleware(config);
    app.use((req, res, next) => authorizationMiddleware(req, res, next));

    // Make sure we're passing the routes to the router
    if (config.routes && config.routes.length > 0) {
      logger.info(
        `Server detected ${config.routes.length} custom routes to pass to router`,
      );
    } else {
      logger.info(`Server detected no custom routes to pass to router`);
    }

    // Add the API routes (including custom routes registered in the router)
    app.use(createRoutes(database, options, authService, config));

    // Add root route
    app.get("/", (req: Request, res: Response) => {
      res.json({
        name: "pretendo",
        resources: config.resources.map((resource) => resource.name),
        documentation: "https://github.com/alexberriman/pretendo",
      });
    });

    // Add docs route before error handler
    // This needs to be outside the main router to avoid RBAC middleware
    const isDocsEnabled =
      options.docs?.enabled ?? process.env.NODE_ENV !== "production";

    if (isDocsEnabled) {
      // Fix typing issue with proper RequestHandler type
      const docsHandler: RequestHandler = async (req, res, _next) => {
        try {
          // Check if authentication is required for docs
          const requireAuth =
            options.docs?.requireAuth ?? process.env.NODE_ENV === "production";

          // Define proper types for user and apiConfig
          interface RequestWithUserAndConfig extends Request {
            user?: { id: string | number; username: string; role?: string };
            apiConfig?: ApiConfig;
          }

          const typedReq = req as RequestWithUserAndConfig;

          if (requireAuth && options.auth?.enabled) {
            // Check if the user is authenticated
            const user = typedReq.user;
            if (!user) {
              res.status(401).json({
                status: 401,
                message: "Authentication required",
                code: "UNAUTHORIZED",
              });
              return;
            }

            // If user doesn't have admin role, deny access
            if (user.role !== "admin") {
              res.status(403).json({
                status: 403,
                message: "Admin role required to access API documentation",
                code: "FORBIDDEN",
              });
              return;
            }
          }

          // Get API config from request
          const apiConfig = typedReq.apiConfig;
          if (!apiConfig) {
            res.status(500).json({
              status: 500,
              message: "API configuration not available",
              code: "SERVER_ERROR",
            });
            return;
          }

          // Import OpenAPI utilities directly to avoid dynamic import issues
          // We can import directly here because the route handler is only registered
          // when the server starts, not when the module is loaded
          const { convertToOpenApi, convertToYaml } = await import(
            "../utils/openapi/index.js"
          );

          // Generate OpenAPI spec
          const openApiSpec = convertToOpenApi(apiConfig);

          // Check for format query parameter
          const format = (req.query.format as string)?.toLowerCase();
          if (format === "yaml") {
            const yamlSpec = convertToYaml(openApiSpec);
            res.setHeader("Content-Type", "text/yaml");
            res.send(yamlSpec);
            return;
          }

          // Default to JSON format
          res.json(openApiSpec);
        } catch (error) {
          logger.error("Error generating OpenAPI documentation:", error);
          res.status(500).json({
            status: 500,
            message: "Failed to generate API documentation",
            details: (error as Error).message,
          });
        }
      };

      // Register the handler with Express
      app.get("/__docs", docsHandler);
    }

    // Add global error handler
    app.use(errorHandlerMiddleware);

    return app;
  };

  // Start the server
  const start = async (customPort?: number): Promise<Result<void, Error>> => {
    if (httpServer) {
      return err(new Error("Server is already running"));
    }

    try {
      // Use custom port if provided
      if (customPort) {
        port = customPort;
      }

      // Initialize server
      initializeServer();

      // Create HTTP server
      return new Promise<Result<void, Error>>((resolve) => {
        httpServer = app.listen(port, host);

        httpServer.once("listening", () => {
          resolve(ok(undefined));
        });

        httpServer.once("error", (error) => {
          httpServer = null;
          resolve(err(error));
        });
      });
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to start server: ${String(error)}`),
      );
    }
  };

  // Stop the server
  const stop = async (): Promise<Result<void, Error>> => {
    if (!httpServer) {
      return err(new Error("Server is not running"));
    }

    return new Promise<Result<void, Error>>((resolve) => {
      httpServer!.close((error) => {
        httpServer = null;

        if (error) {
          resolve(err(error));
        } else {
          resolve(ok(undefined));
        }
      });
    });
  };

  // Get the server URL
  const getUrl = (): string => {
    return `http://${host}:${port}`;
  };

  return {
    start,
    stop,
    getUrl,
    logs: logManager,
  };
};
