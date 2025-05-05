import { Result } from "../../types/result.js";

// Define request, response, and next function types without using Express directly
export type ServerRequest = Record<string, unknown>;
export type ServerResponse = Record<string, unknown>;
export type ServerNextFunction = (error?: unknown) => void;

// Define the handler type for route handlers and middleware
export type RequestHandler = (
  req: ServerRequest,
  res: ServerResponse,
  next: ServerNextFunction,
) => void | Promise<void>;

// Define router configurator function type
export type RouterConfigurator = (router: unknown) => void;

/**
 * ServerAdapter interface provides an abstraction over HTTP servers like Express, Fastify, etc.
 * This allows Pretendo to be framework-agnostic and support multiple underlying HTTP server implementations.
 */
export interface ServerAdapter {
  /**
   * Creates a new server instance
   */
  createServer(): void;

  /**
   * Starts the server on the specified port and host
   * @param port The port to listen on
   * @param host The host to bind to
   * @returns A result containing void or an error
   */
  start(port: number, host: string): Promise<Result<void, Error>>;

  /**
   * Stops the server
   * @returns A result containing void or an error
   */
  stop(): Promise<Result<void, Error>>;

  /**
   * Gets the URL of the running server
   * @returns The server URL
   */
  getUrl(): string;

  /**
   * Registers a route in the server
   * @param method The HTTP method (GET, POST, etc.)
   * @param path The route path
   * @param handler The route handler function
   */
  registerRoute(method: string, path: string, handler: RequestHandler): void;

  /**
   * Registers middleware to be executed before route handlers
   * @param middleware The middleware function
   */
  useMiddleware(middleware: RequestHandler): void;

  /**
   * Allows passing custom route configuration to the framework-specific router
   * @param configureRouter A function that configures the router with framework-specific routes
   */
  configureRoutes(configureRouter: RouterConfigurator): void;

  /**
   * Registers a hook function to be executed at a specific lifecycle event
   * @param event The lifecycle event (e.g., "onRequest", "onResponse")
   * @param handler The hook handler function
   */
  registerHook(event: string, handler: RequestHandler): void;

  /**
   * Gets the native server instance (e.g., Express app) for advanced use cases
   * @returns The native server instance
   */
  getNativeServer(): unknown;
}

/**
 * Hook event types that can be registered with a ServerAdapter
 */
export enum HookEvent {
  ON_REQUEST = "onRequest",
  ON_RESPONSE = "onResponse",
  ON_ERROR = "onError",
  BEFORE_ROUTE = "beforeRoute",
  AFTER_ROUTE = "afterRoute",
}

/**
 * Basic implementation of ServerAdapter methods to reduce duplication in adapter implementations
 */
export abstract class BaseServerAdapter implements ServerAdapter {
  protected port = 3000;
  protected host = "localhost";
  protected hooks: Record<string, Array<RequestHandler>> = {
    [HookEvent.ON_REQUEST]: [],
    [HookEvent.ON_RESPONSE]: [],
    [HookEvent.ON_ERROR]: [],
    [HookEvent.BEFORE_ROUTE]: [],
    [HookEvent.AFTER_ROUTE]: [],
  };

  abstract createServer(): void;
  abstract start(port: number, host: string): Promise<Result<void, Error>>;
  abstract stop(): Promise<Result<void, Error>>;
  abstract registerRoute(
    method: string,
    path: string,
    handler: RequestHandler,
  ): void;
  abstract useMiddleware(middleware: RequestHandler): void;
  abstract configureRoutes(configureRouter: RouterConfigurator): void;
  abstract getNativeServer(): unknown;

  getUrl(): string {
    return `http://${this.host}:${this.port}`;
  }

  registerHook(event: string, handler: RequestHandler): void {
    if (!this.hooks[event]) {
      this.hooks[event] = [];
    }
    this.hooks[event].push(handler);
  }

  protected executeHooks(
    event: string,
    req: ServerRequest,
    res: ServerResponse,
    next: ServerNextFunction,
  ): void {
    if (!this.hooks[event] || this.hooks[event].length === 0) {
      next();
      return;
    }

    // Execute hooks in sequence
    const hooks = [...this.hooks[event]];
    const executeNext = (index: number) => {
      if (index >= hooks.length) {
        next();
        return;
      }

      try {
        const result = hooks[index](req, res, (error?: unknown) => {
          if (error) {
            next(error);
            return;
          }
          executeNext(index + 1);
        });

        // Handle async hooks
        if (result instanceof Promise) {
          result.then(() => executeNext(index + 1)).catch(next);
        }
      } catch (error) {
        next(error);
      }
    };

    executeNext(0);
  }
}
