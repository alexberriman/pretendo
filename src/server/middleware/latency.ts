import { Request, Response, NextFunction } from "express";
import { ApiOptions } from "../../types/index.js";

export const createLatencyMiddleware = (options: ApiOptions) => {
  const latency = options.latency;

  if (!latency || !latency.enabled) {
    // No latency simulation, just pass through
    return (req: Request, res: Response, next: NextFunction) => {
      next();
    };
  }

  return (req: Request, res: Response, next: NextFunction) => {
    let delay = 0;

    if (latency.fixed !== undefined && latency.fixed > 0) {
      // Fixed delay
      delay = latency.fixed;
    } else if (latency.min !== undefined && latency.max !== undefined) {
      // Random delay between min and max
      delay =
        Math.floor(Math.random() * (latency.max - latency.min + 1)) +
        latency.min;
    }

    if (delay > 0) {
      setTimeout(next, delay);
    } else {
      next();
    }
  };
};
