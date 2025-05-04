import { Request, Response, NextFunction } from "express";
import { CustomRoute, DatabaseService } from "../../../types/index.js";
import { handleJsonRoute } from "./json-route-handler.js";
import { handleJavaScriptRoute } from "./js-route-executor.js";
import { handleTestRoutes } from "./test-routes.js";
import { isValidRoute, logRouteInfo } from "../utils/route-helpers.js";

/**
 * Creates a handler for custom routes defined in the schema.
 *
 * The handler supports both JSON and JavaScript routes:
 * - JSON routes return static responses with parameter substitution
 * - JavaScript routes execute custom code to generate dynamic responses
 *
 * In test mode (when PRETENDO_TEST=true, NODE_ENV=test, or VITEST is defined),
 * special handling is added for test-specific routes to ensure tests run consistently
 * without hanging or causing issues. This special handling is only active during tests
 * and doesn't affect production behavior.
 */
export const createCustomRouteHandler = (
  customRoute: CustomRoute,
  db?: DatabaseService,
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Log route info
      logRouteInfo(req, customRoute);

      // Check if this is a test route that needs special handling
      if (handleTestRoutes(customRoute.path, req.method, req, res, db)) {
        return; // Test route was handled
      }

      // Validate the route
      if (!isValidRoute(customRoute, res)) {
        return; // Route validation failed
      }

      // Handle different route types
      if (customRoute.type === "json") {
        handleJsonRoute(req, res, customRoute);
      } else if (customRoute.type === "javascript") {
        await handleJavaScriptRoute(req, res, customRoute, db);
      }
    } catch (error) {
      next(error);
    }
  };
};
