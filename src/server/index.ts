import express, { Express, Request, Response } from "express";
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
