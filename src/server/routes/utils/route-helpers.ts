import { Request, Response } from "express";
import { CustomRoute } from "../../../types/index.js";
import { logger } from "../../../utils/debug-logger.js";

/**
 * Checks if a route exists and has valid type
 * Returns true if the route is valid, false otherwise
 */
export const isValidRoute = (
  customRoute: CustomRoute,
  res: Response,
): boolean => {
  // Validate route type
  if (customRoute.type !== "json" && customRoute.type !== "javascript") {
    res.status(500).json({
      status: 500,
      message: "Invalid custom route type",
      code: "INVALID_ROUTE_TYPE",
    });
    return false;
  }

  return true;
};

/**
 * Extracts and logs basic route information
 */
export const logRouteInfo = (req: Request, customRoute: CustomRoute): void => {
  const routeMethod = customRoute.method.toUpperCase();
  const routePath = customRoute.path;
  logger.info(`Handling custom route: ${routeMethod} ${routePath}`);
};

/**
 * Safely stringifies request body for logging
 * Handles any potential circular references or other stringify failures
 */
export const safeStringify = (obj: unknown): string => {
  try {
    return JSON.stringify(obj);
  } catch {
    // Removed unused variable
    return "[Object - cannot stringify]";
  }
};
