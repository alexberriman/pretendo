import express, { Request, Response, NextFunction, Express } from "express";
import {
  ApiConfig,
  DatabaseService,
  Result,
  Server,
  ServerOptions,
  LifecycleHooks,
  RequestHandler as ApiRequestHandler,
  err,
  // ok is not used, rename to _ok to satisfy linting
  ok as _ok,
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
import {
  _expressHandlerToServerHandler as expressHandlerToServerHandler,
  // Prefixing with _ to match the naming convention for unused variables
  serverHandlerToExpressHandler as _serverHandlerToExpressHandler,
} from "./adapters/type-helpers.js";
import { logger } from "../utils/debug-logger.js";
import { createRoutes } from "./routes/index.js";
import {
  createServerAdapter,
  ServerAdapter,
  HookEvent,
} from "./adapters/index.js";

/**
 * Create a server instance with the provided configuration and database service
 * @param config The validated API configuration
 * @param database The database service to use
 * @param serverOptions Additional server options including adapter type, custom routes, and hooks
 * @returns A Server instance
 */
export const createServer = (
  config: ApiConfig,
  database: DatabaseService,
  serverOptions?: ServerOptions,
): Server => {
  const options = config.options || {};
  const port = options.port || 3000;
  const host = options.host || "localhost";

  // Initialize authentication service
  const authService = new AuthService(options);

  // Create the server adapter
  const adapter = createServerAdapter(serverOptions?.adapterType);

  // Initialize the server
  adapter.createServer();

  // Register all the middleware and routes
  configureServer(adapter, config, database, authService, serverOptions);

  // Start the server
  const start = async (
    customPort?: number,
    customHost?: string,
  ): Promise<Result<void, Error>> => {
    try {
      const startPort = customPort || port;
      const startHost = customHost || host;

      return await adapter.start(startPort, startHost);
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
    try {
      return await adapter.stop();
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to stop server: ${String(error)}`),
      );
    }
  };

  // Get the server URL
  const getUrl = (): string => {
    return adapter.getUrl();
  };

  // Get the adapter for advanced operations
  const getAdapter = (): ServerAdapter => {
    return adapter;
  };

  return {
    start,
    stop,
    getUrl,
    logs: logManager,
    getAdapter,
  };
};

/**
 * Configure the server with middleware, routes, and hooks
 * @param adapter The server adapter to configure
 * @param config The API configuration
 * @param database The database service
 * @param authService The authentication service
 * @param serverOptions Additional server options
 */
function configureServer(
  adapter: ServerAdapter,
  config: ApiConfig,
  database: DatabaseService,
  authService: AuthService,
  serverOptions?: ServerOptions,
): void {
  const options = config.options || {};

  // Register lifecycle hooks first if provided
  registerHooks(adapter, serverOptions?.hooks);

  // Register middleware
  adapter.useMiddleware(
    expressHandlerToServerHandler(createLoggerMiddleware(options)),
  );
  adapter.useMiddleware(
    expressHandlerToServerHandler(createCorsMiddleware(options)),
  );
  adapter.useMiddleware(
    expressHandlerToServerHandler(createLatencyMiddleware(options)),
  );
  adapter.useMiddleware(
    expressHandlerToServerHandler(createErrorSimulationMiddleware(options)),
  );

  // Add database and apiConfig to request object
  adapter.useMiddleware(
    expressHandlerToServerHandler((req, res, next) => {
      // Use unknown cast first to avoid TypeScript errors
      (req as unknown as { db: DatabaseService }).db = database;
      (req as unknown as { apiConfig: ApiConfig }).apiConfig = config;
      next();
    }),
  );

  // Add authentication middleware
  adapter.useMiddleware(
    expressHandlerToServerHandler(createAuthMiddleware(authService, options)),
  );

  // Add authorization middleware
  const authorizationMiddleware = createAuthorizationMiddleware(config);
  adapter.useMiddleware(
    expressHandlerToServerHandler((req, res, next) =>
      authorizationMiddleware(req, res, next),
    ),
  );

  // Create and register API routes
  const apiRoutes = createRoutes(database, options, authService, config);

  // Add routes from the API router
  adapter.useMiddleware(expressHandlerToServerHandler(apiRoutes));

  // Register root route
  adapter.registerRoute(
    "get",
    "/",
    expressHandlerToServerHandler((req: Request, res: Response) => {
      res.json({
        name: "pretendo",
        resources: config.resources.map((resource) => resource.name),
        documentation: "https://github.com/alexberriman/pretendo",
      });
    }),
  );

  // Register docs route
  const isDocsEnabled =
    options.docs?.enabled ?? process.env.NODE_ENV !== "production";
  if (isDocsEnabled) {
    adapter.registerRoute(
      "get",
      "/__docs",
      expressHandlerToServerHandler(
        async (req: Request, res: Response, _next) => {
          try {
            // Check if authentication is required for docs
            const requireAuth =
              options.docs?.requireAuth ??
              process.env.NODE_ENV === "production";

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
        },
      ),
    );
  }

  // Add custom routes if provided
  if (serverOptions?.routes) {
    try {
      // Get direct access to Express app for programmatic routes
      const expressApp = adapter.getNativeServer() as Express;

      // Create and configure a custom router for programmatic routes
      const programmaticRouter = express.Router();

      // Apply the routes directly to the router
      if (typeof serverOptions.routes === "function") {
        // Add the programmatic routes
        serverOptions.routes(programmaticRouter);

        // Mount the router at the root path with highest priority - must go first
        // Define router layer type to avoid using 'any'
        type RouterStackLayer = {
          handle: unknown;
          name: string;
          route: unknown;
        };

        expressApp._router.stack.unshift({
          handle: programmaticRouter,
          name: "router",
          route: undefined,
        } as RouterStackLayer);

        logger.info(
          "Successfully registered custom programmatic routes with highest priority",
        );

        // For debugging, add a middleware that logs all requests
        expressApp.use((req, res, next) => {
          logger.debug(
            `Debug middleware - incoming request to: ${req.method} ${req.path}`,
          );
          next();
        });
      }
    } catch (error) {
      logger.error("Error registering custom routes:", error);
    }
  }

  // Register error handler as the last middleware
  // Express error middleware needs special handling as it has 4 parameters instead of 3
  adapter.useMiddleware(
    // Convert from our adapter's RequestHandler type to a compatible one
    // This is needed because our middleware function will receive ServerRequest types
    (req, res, next) => {
      // Simple pass-through middleware
      next();
    },
  );

  // Add the error handler directly to the Express app
  const expressApp = adapter.getNativeServer() as Express;
  if (expressApp) {
    expressApp.use(errorHandlerMiddleware);
  }

  // Store the executeJs function for JavaScript routes if provided
  if (serverOptions?.executeJs) {
    // Store it in a global context that can be accessed by the JS route executor
    // Define type for global object with our custom property
    type PretendoGlobal = typeof globalThis & {
      __pretendoExecuteJs: typeof serverOptions.executeJs;
    };
    (global as PretendoGlobal).__pretendoExecuteJs = serverOptions.executeJs;
  }
}

/**
 * Register hooks with the server adapter
 * @param adapter The server adapter
 * @param hooks The hooks to register
 */
function registerHooks(adapter: ServerAdapter, hooks?: LifecycleHooks): void {
  if (!hooks) {
    return;
  }

  // Get the Express app for direct access
  const expressApp = adapter.getNativeServer() as Express;

  // Map hook types to adapter events
  const hookMapping: Record<string, HookEvent> = {
    onRequest: HookEvent.ON_REQUEST,
    onResponse: HookEvent.ON_RESPONSE,
    onError: HookEvent.ON_ERROR,
    beforeRoute: HookEvent.BEFORE_ROUTE,
    afterRoute: HookEvent.AFTER_ROUTE,
  };

  // Register onRequest hook as Express middleware for guaranteed execution
  if (hooks.onRequest) {
    const requestHandlers = Array.isArray(hooks.onRequest)
      ? hooks.onRequest
      : [hooks.onRequest];

    // Register each onRequest handler as middleware
    requestHandlers.forEach((handler) => {
      expressApp.use((req, res, next) => {
        try {
          // Cast Express request/response to our API types using as unknown as
          (handler as (req: unknown, res: unknown, next: unknown) => void)(
            req,
            res,
            next,
          );
        } catch (error) {
          next(error);
        }
      });
    });

    logger.info("Registered onRequest hooks as global middleware");
  }

  // Register beforeRoute hook as Express middleware
  if (hooks.beforeRoute) {
    const routeHandlers = Array.isArray(hooks.beforeRoute)
      ? hooks.beforeRoute
      : [hooks.beforeRoute];

    // Register each beforeRoute handler as middleware
    routeHandlers.forEach((handler) => {
      expressApp.use((req, res, next) => {
        try {
          // Cast Express request/response to our API types using as unknown as
          (handler as (req: unknown, res: unknown, next: unknown) => void)(
            req,
            res,
            next,
          );
        } catch (error) {
          next(error);
        }
      });
    });

    logger.info("Registered beforeRoute hooks as global middleware");
  }

  // For other hooks, use the adapter registration
  Object.entries(hooks).forEach(([hookName, handlers]) => {
    // Skip hooks we've handled specially
    if (["onRequest", "beforeRoute"].includes(hookName)) {
      return;
    }

    const event = hookMapping[hookName] || hookName;

    if (handlers) {
      // Handle both single handlers and arrays of handlers
      const handlerArray = Array.isArray(handlers) ? handlers : [handlers];

      handlerArray.forEach((handler: ApiRequestHandler) => {
        // Convert API RequestHandler to ServerAdapter RequestHandler
        adapter.registerHook(
          event,
          expressHandlerToServerHandler(
            handler as unknown as (
              req: Request,
              res: Response,
              next: NextFunction,
            ) => void | Promise<void>,
          ),
        );
        logger.info(`Registered ${hookName} hook via adapter`);
      });
    }
  });
}
