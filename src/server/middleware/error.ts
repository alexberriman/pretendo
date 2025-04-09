import { Request, Response, NextFunction } from "express";
import { ApiOptions, ErrorResponse } from "../../types/index.js";

// Middleware to randomly simulate errors based on configuration
export const createErrorSimulationMiddleware = (options: ApiOptions) => {
  const errorConfig = options.errorSimulation;

  if (!errorConfig || !errorConfig.enabled) {
    // No error simulation, just pass through
    return (req: Request, res: Response, next: NextFunction) => {
      next();
    };
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Check for query parameter trigger if configured
    if (
      errorConfig.queryParamTrigger &&
      req.query[errorConfig.queryParamTrigger]
    ) {
      const errorCode = parseInt(
        req.query[errorConfig.queryParamTrigger] as string,
        10,
      );

      if (!isNaN(errorCode) && errorCode >= 400) {
        return res.status(errorCode).json({
          status: errorCode,
          message: `Error triggered via query parameter: ${errorConfig.queryParamTrigger}=${errorCode}`,
        } as ErrorResponse);
      }
    }

    // Apply random error rate if configured
    if (errorConfig.rate && errorConfig.rate > 0) {
      const random = Math.random();

      if (random < errorConfig.rate) {
        // Randomly pick an error code if available
        let statusCode = 500; // Default

        if (errorConfig.statusCodes && errorConfig.statusCodes.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * errorConfig.statusCodes.length,
          );
          statusCode = errorConfig.statusCodes[randomIndex];
        }

        return res.status(statusCode).json({
          status: statusCode,
          message: `Simulated server error (${statusCode})`,
          code: "SIMULATED_ERROR",
        } as ErrorResponse);
      }
    }

    next();
  };
};

// Global error handler middleware
export const errorHandlerMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(err.stack);

  const errorResponse: ErrorResponse = {
    status: 500,
    message: "Internal Server Error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  };

  res.status(500).json(errorResponse);
};
