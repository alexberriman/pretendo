import cors from "cors";
import { Request, Response, NextFunction } from "express";
import { ApiOptions } from "../../types/index.js";

export const createCorsMiddleware = (options: ApiOptions) => {
  if (options.corsEnabled === false) {
    // Return a middleware that blocks CORS requests
    return (req: Request, res: Response, next: NextFunction) => {
      next();
    };
  }

  // Use the cors package with default options
  return cors();
};
