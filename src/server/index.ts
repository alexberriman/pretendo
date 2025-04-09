import express, { Express, Request, Response } from "express";
import morgan from "morgan";
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
  createErrorSimulationMiddleware,
  createLatencyMiddleware,
  errorHandlerMiddleware,
} from "./middleware/index.js";
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
    if (options.logRequests !== false) {
      app.use(morgan("dev"));
    }

    // Add CORS middleware
    app.use(createCorsMiddleware(options));

    // Add JSON body parser
    app.use(express.json());

    // Add latency simulation middleware
    app.use(createLatencyMiddleware(options));

    // Add error simulation middleware
    app.use(createErrorSimulationMiddleware(options));

    // Add authentication middleware
    app.use(createAuthMiddleware(authService, options));

    // Add API routes
    app.use(createRoutes(database, options, authService));

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
  };
};
