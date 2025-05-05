import express, {
  Express,
  Request,
  Response,
  NextFunction,
  Router,
} from "express";
import http from "http";
import {
  BaseServerAdapter,
  HookEvent,
  RequestHandler,
} from "./server-adapter.js";
import { Result, err, ok } from "../../types/result.js";
import { logger } from "../../utils/debug-logger.js";
import {
  toServerRequest,
  toServerResponse,
  toServerNextFunction,
  // Import the renamed function directly
  _expressHandlerToServerHandler,
  serverHandlerToExpressHandler,
} from "./type-helpers.js";

/**
 * Express implementation of the ServerAdapter
 */
export class ExpressAdapter extends BaseServerAdapter {
  private app: Express | null = null;
  private httpServer: http.Server | null = null;
  private router: Router | null = null;

  constructor() {
    super();
  }

  /**
   * Creates a new Express server instance
   */
  createServer(): void {
    this.app = express();
    this.router = express.Router();

    // Remove the "X-Powered-By: Express" header and add custom Pretendo header
    this.app.disable("x-powered-by");
    this.app.use((req, res, next) => {
      res.setHeader("X-Powered-By", "Pretendo");
      next();
    });

    // Set up basic JSON parsing
    this.app.use(express.json());

    // Add the onRequest hook middleware that will be first in the chain
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.executeHooks(
        HookEvent.ON_REQUEST,
        toServerRequest(req),
        toServerResponse(res),
        toServerNextFunction(next),
      );
    });
  }

  /**
   * Starts the Express server on the specified port and host
   * @param port The port to listen on
   * @param host The host to bind to
   * @returns A result containing void or an error
   */
  async start(port: number, host: string): Promise<Result<void, Error>> {
    if (this.httpServer) {
      return err(new Error("Server is already running"));
    }

    if (!this.app) {
      return err(
        new Error("Server has not been created. Call createServer() first."),
      );
    }

    try {
      this.port = port;
      this.host = host;

      // Add router to the app
      if (this.router) {
        this.app.use(this.router);
      }

      // Add error handling middleware as the last middleware
      this.app.use(
        (error: unknown, req: Request, res: Response, next: NextFunction) => {
          this.executeHooks(
            HookEvent.ON_ERROR,
            toServerRequest(req),
            toServerResponse(res),
            (hookError?: unknown) => {
              // If the error hooks don't handle the error, use the default error handling
              if (!res.headersSent) {
                logger.error("Server error:", error);
                res.status(500).json({
                  status: 500,
                  message:
                    error instanceof Error
                      ? error.message
                      : "Internal server error",
                  code: "SERVER_ERROR",
                });
              }
              next(hookError || error);
            },
          );
        },
      );

      // Start the server
      return new Promise<Result<void, Error>>((resolve) => {
        this.httpServer = this.app!.listen(port, host);

        this.httpServer.once("listening", () => {
          resolve(ok(undefined));
        });

        this.httpServer.once("error", (error) => {
          this.httpServer = null;
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
  }

  /**
   * Stops the Express server
   * @returns A result containing void or an error
   */
  async stop(): Promise<Result<void, Error>> {
    if (!this.httpServer) {
      return err(new Error("Server is not running"));
    }

    return new Promise<Result<void, Error>>((resolve) => {
      this.httpServer!.close((error) => {
        this.httpServer = null;

        if (error) {
          resolve(err(error));
        } else {
          resolve(ok(undefined));
        }
      });
    });
  }

  /**
   * Registers a route in the Express server
   * @param method The HTTP method (GET, POST, etc.)
   * @param path The route path
   * @param handler The route handler function
   */
  registerRoute(method: string, path: string, handler: RequestHandler): void {
    if (!this.router) {
      throw new Error(
        "Server has not been created. Call createServer() first.",
      );
    }

    // Convert handler to Express-compatible function
    const expressHandler = serverHandlerToExpressHandler(handler);

    const wrappedHandler = (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      // Execute beforeRoute hooks
      this.executeHooks(
        HookEvent.BEFORE_ROUTE,
        toServerRequest(req),
        toServerResponse(res),
        (error?: unknown) => {
          if (error) {
            next(error);
            return;
          }

          // Execute the actual route handler
          Promise.resolve(expressHandler(req, res, next))
            .then(() => {
              // Execute afterRoute hooks if the response hasn't been sent yet
              if (!res.headersSent) {
                this.executeHooks(
                  HookEvent.AFTER_ROUTE,
                  toServerRequest(req),
                  toServerResponse(res),
                  toServerNextFunction(next),
                );
              }
            })
            .catch(next);
        },
      );
    };

    // Register the route with the Express router
    switch (method.toLowerCase()) {
      case "get":
        this.router.get(path, wrappedHandler);
        break;
      case "post":
        this.router.post(path, wrappedHandler);
        break;
      case "put":
        this.router.put(path, wrappedHandler);
        break;
      case "patch":
        this.router.patch(path, wrappedHandler);
        break;
      case "delete":
        this.router.delete(path, wrappedHandler);
        break;
      default:
        logger.warn(
          `Unsupported HTTP method: ${method}. Route ${path} not registered.`,
        );
    }
  }

  /**
   * Registers middleware to be executed before route handlers
   * @param middleware The middleware function
   */
  useMiddleware(middleware: RequestHandler): void {
    if (!this.app) {
      throw new Error(
        "Server has not been created. Call createServer() first.",
      );
    }

    // Convert the middleware to an Express-compatible function
    const expressMiddleware = serverHandlerToExpressHandler(middleware);
    this.app.use(expressMiddleware);
  }

  /**
   * Allows passing custom route configuration to the Express router
   * @param configureRouter A function that configures the Express router with routes
   */
  configureRoutes(configureRouter: (router: Router) => void): void {
    if (!this.app) {
      throw new Error(
        "Server has not been created. Call createServer() first.",
      );
    }

    try {
      // Create a new router for the custom routes
      if (typeof configureRouter === "function") {
        // Create a new Express app just for the custom routes
        // This ensures proper middleware ordering
        const previousApp = this.app;
        this.app = express();

        // Set up basic JSON parsing and other required middleware
        this.app.disable("x-powered-by");
        this.app.use(express.json());

        // Add the custom routes directly to this app
        configureRouter(this.app as unknown as Router);

        // Use this app as a middleware in the original app
        // This way the custom routes get higher priority
        previousApp.use((req, res, next) => {
          // Route the request through our custom app first
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.app as any).handle(req, res, (err: unknown) => {
            if (err) {
              return next(err);
            }

            // If no route matched in the custom app (404),
            // continue to the regular routes
            if (!res.headersSent) {
              return next();
            }
          });
        });

        // Restore the original app as the main one
        // but keep the custom routes router as a middleware
        this.app = previousApp;

        logger.info("Successfully registered custom routes with high priority");
      } else {
        logger.warn("Invalid router configurator provided");
      }
    } catch (error) {
      logger.error("Error registering custom routes:", error);
      throw error;
    }
  }

  /**
   * Gets the native Express application instance for advanced use cases
   * @returns The native Express app instance
   */
  getNativeServer(): Express {
    if (!this.app) {
      throw new Error(
        "Server has not been created. Call createServer() first.",
      );
    }

    return this.app;
  }
}
