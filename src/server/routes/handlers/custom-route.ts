import { Request, Response, NextFunction } from "express";
import {
  CustomRoute,
  DatabaseService,
  RequestWithUser,
} from "../../../types/index.js";
import { handleJsonRoute } from "./json-route-handler.js";
import { handleJavaScriptRoute } from "./js-route-executor.js";
import { handleTestRoutes } from "./test-routes.js";
import { isValidRoute, logRouteInfo } from "../utils/route-helpers.js";
import { logger } from "../../../utils/debug-logger.js";

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
/**
 * Check if the user has the required role for the route
 */
const checkRouteAccess = (
  req: Request & RequestWithUser,
  customRoute: CustomRoute,
): boolean => {
  // If route has no auth config, allow access
  if (!customRoute.auth) {
    return true;
  }

  // If auth is explicitly disabled for this route, allow access regardless of global settings
  if (customRoute.auth.enabled === false) {
    logger.info(`Route ${customRoute.path} has auth explicitly disabled`);
    return true;
  }

  // If auth is explicitly enabled but no roles specified, just require authentication
  if (
    customRoute.auth.enabled === true &&
    (!customRoute.auth.roles || customRoute.auth.roles.length === 0)
  ) {
    // Just check that the user is authenticated
    const isAuthenticated = !!req.user;
    logger.info(
      `Route ${customRoute.path} requires authentication, user ${isAuthenticated ? "is" : "is not"} authenticated`,
    );
    return isAuthenticated;
  }

  // If roles are specified, check user role
  if (customRoute.auth.roles && customRoute.auth.roles.length > 0) {
    // No user means no access
    if (!req.user) {
      logger.info(
        `Route ${customRoute.path} requires role, but user is not authenticated`,
      );
      return false;
    }

    // Wildcard role means any authenticated user can access
    if (customRoute.auth.roles.includes("*")) {
      logger.info(
        `Route ${customRoute.path} allows any authenticated user via wildcard role`,
      );
      return true;
    }

    // Check if user has a required role
    const hasRequiredRole =
      !!req.user.role && customRoute.auth.roles.includes(req.user.role);
    logger.info(
      `Route ${customRoute.path} requires role from [${customRoute.auth.roles.join(", ")}], user has role ${req.user.role}, ${hasRequiredRole ? "access granted" : "access denied"}`,
    );
    return hasRequiredRole;
  }

  // Default to allow if no specific auth rules
  return true;
};

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

      // Check route-level authentication if configured
      if (customRoute.auth) {
        const typedReq = req as Request & RequestWithUser;

        // Check access based on route auth config
        if (!checkRouteAccess(typedReq, customRoute)) {
          if (!typedReq.user) {
            // Not authenticated
            res.status(401).json({
              status: 401,
              message: "Authentication required",
              code: "UNAUTHORIZED",
            });
            return;
          } else {
            // Authenticated but unauthorized
            res.status(403).json({
              status: 403,
              message: "Insufficient permissions",
              code: "FORBIDDEN",
            });
            return;
          }
        }
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
