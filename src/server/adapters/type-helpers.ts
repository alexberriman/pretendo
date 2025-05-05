import { Request, Response, NextFunction } from "express";
import {
  ServerRequest,
  ServerResponse,
  ServerNextFunction,
  RequestHandler,
} from "./server-adapter.js";

/**
 * Type adapters to convert between express and generic server adapter types
 * This helps us maintain compatibility between the abstract interfaces and concrete Express types.
 */

/**
 * Converts an Express Request to our generic ServerRequest
 */
export function toServerRequest(req: Request): ServerRequest {
  return req as unknown as ServerRequest;
}

/**
 * Converts an Express Response to our generic ServerResponse
 */
export function toServerResponse(res: Response): ServerResponse {
  return res as unknown as ServerResponse;
}

/**
 * Converts an Express NextFunction to our generic ServerNextFunction
 */
export function toServerNextFunction(next: NextFunction): ServerNextFunction {
  return next as unknown as ServerNextFunction;
}

/**
 * Adapts an Express handler to our generic RequestHandler
 * This makes TypeScript happy while letting functions work as expected at runtime
 */
export function _expressHandlerToServerHandler(
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void | Promise<void>,
): RequestHandler {
  return handler as unknown as RequestHandler;
}

/**
 * Adapts our generic RequestHandler to an Express handler function
 * This makes TypeScript happy while letting functions work as expected at runtime
 */
export function serverHandlerToExpressHandler(
  handler: RequestHandler,
): (req: Request, res: Response, next: NextFunction) => void | Promise<void> {
  return handler as unknown as (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void | Promise<void>;
}
