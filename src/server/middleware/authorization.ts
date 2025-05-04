import { Request, Response, NextFunction } from "express";
import {
  ApiConfig,
  ErrorResponse,
  RequestWithDatabase,
  RequestWithResource,
  RequestWithUser,
} from "../../types/index.js";
import { logger } from "../../utils/debug-logger.js";

// Combined request type for authorization middleware
export type AuthenticatedRequest = Request &
  RequestWithUser &
  RequestWithResource &
  Partial<RequestWithDatabase>;

// Function to determine action from method and request
const getActionFromMethod = (method: string, req: Request): string => {
  if (method === "GET") {
    return req.params.id ? "get" : "list";
  }

  const actionMap: Record<string, string> = {
    POST: "create",
    PUT: "update",
    PATCH: "update",
    DELETE: "delete",
  };

  return actionMap[method] || "";
};

// Check if a user has a required role
const hasRole = (
  userRole: string | undefined,
  requiredRoles: string[],
): boolean => {
  // No user role means no access
  if (!userRole) {
    logger.info("hasRole check failed: No user role defined");
    return false;
  }

  // Wildcard permission allows any authenticated user
  if (requiredRoles.includes("*")) {
    logger.info(
      "hasRole check passed: Wildcard (*) role included in required roles",
    );
    return true;
  }

  // Check if the user's role matches any required role
  const hasRequiredRole = requiredRoles.includes(userRole);
  logger.info(
    `hasRole check: User role '${userRole}' ${hasRequiredRole ? "matches" : "does not match"} one of required roles [${requiredRoles.join(", ")}]`,
  );

  return hasRequiredRole;
};

// Check if user is the owner of a resource
// This is used when 'owner' is in the required roles
const isOwner = async (
  req: AuthenticatedRequest,
  resourceName: string,
  resourceId: string | number,
  apiConfig: ApiConfig,
): Promise<boolean> => {
  // No user or no resource or no username = not the owner
  if (!req.user || !req.resource || !req.user.username) return false;

  // If the resource doesn't have an ownership field, can't be the owner
  const ownerField = req.resource.ownedBy;
  if (!ownerField) return false;

  // Get the database service from the request (added in route setup)
  const db = req.db;
  if (!db) return false;

  // Get the resource operations
  const resourceResult = db.getResource(resourceName);
  if (!resourceResult.ok) return false;

  const resource = resourceResult.value;

  // Get the record
  const result = await resource.findById(resourceId);
  if (!result.ok || !result.value) return false;

  // Get the owner of the resource
  const record = result.value;
  const ownerId = record[ownerField];

  // If no owner ID in the record, can't be the owner
  if (ownerId === undefined || ownerId === null) return false;

  // Get user resource configuration
  const userResourceName = apiConfig.options?.auth?.userResource || "users";
  const usernameField = apiConfig.options?.auth?.usernameField || "username";

  // Get the users resource to find the current user's ID
  const usersResourceResult = db.getResource(userResourceName);
  if (!usersResourceResult.ok) {
    console.warn(
      `User resource '${userResourceName}' not found for ownership check`,
    );
    return false;
  }

  const usersResource = usersResourceResult.value;

  // Find the current user by username - use configured username field
  const query: Record<string, string> = {};
  query[usernameField] = req.user.username;

  let userId: string | number | null = null;

  try {
    const userResult = await usersResource.findOne(query);
    if (!userResult.ok || !userResult.value) {
      console.warn(`User with ${usernameField}=${req.user.username} not found`);
      return false;
    }

    userId = userResult.value.id as string | number;
  } catch (error) {
    console.error("Error finding user for ownership check:", error);
    return false;
  }

  // Compare the owner ID to the current user's ID
  return ownerId === userId;
};

// Create authorization middleware
export const createAuthorizationMiddleware = (apiConfig: ApiConfig) => {
  logger.info("Creating authorization middleware with config:", {
    resources: apiConfig.resources.map((r) => ({
      name: r.name,
      access: r.access,
    })),
    auth: apiConfig.options?.auth,
  });

  return (req: Request, res: Response, next: NextFunction) => {
    // Main authorization logic runs asynchronously
    const runAuthorization = async () => {
      // Cast to our combined type
      const authReq = req as AuthenticatedRequest;

      // If no auth configuration, allow all requests
      if (!apiConfig.options?.auth?.enabled) {
        return next();
      }

      // Skip auth check for login/logout
      const authEndpoint = apiConfig.options.auth.authEndpoint || "/auth/login";
      const authPath = authEndpoint.startsWith("/")
        ? authEndpoint.substring(1)
        : authEndpoint;
      if (req.path === `/${authPath}` || req.path === "/auth/logout") {
        return next();
      }

      // Skip auth check for admin routes
      if (req.path.startsWith("/__")) {
        return next();
      }

      // Get resource name from params
      const resourceName = req.params.resource;
      if (!resourceName) {
        return next(); // No resource = not a resource route
      }

      logger.info(
        `Authorization check for resource: ${resourceName}, method: ${req.method}, path: ${req.path}`,
      );

      // Find the resource configuration
      const resource = apiConfig.resources.find((r) => r.name === resourceName);
      if (!resource) {
        logger.warn(
          `Resource '${resourceName}' not found in config for authorization check`,
        );
        return next(); // Resource not found = let the route handler handle it
      }

      // Store the resource in the request for later use
      // Add ownerOnly flag to resource to indicate restriction in request
      const resourceWithFlags = { ...resource, __ownerOnly: false };
      authReq.resource = resourceWithFlags;

      // Determine the action being performed based on HTTP method
      const action = getActionFromMethod(req.method, req);

      // Skip authorization if no access controls are defined
      if (!resource.access) {
        logger.info(`No access control defined for resource: ${resourceName}`);
        return next();
      }

      // Log the complete resource access controls
      logger.info(
        `Resource access controls for ${resourceName}:`,
        resource.access,
      );

      // Action-specific access controls
      const accessControl =
        resource.access[action as keyof typeof resource.access];
      logger.info(
        `Action-specific access control for ${resourceName}.${action}:`,
        accessControl,
      );

      // If no access control for this specific action, allow the request
      if (
        !accessControl ||
        !Array.isArray(accessControl) ||
        accessControl.length === 0
      ) {
        logger.info(
          `No access control for action ${action} on resource ${resourceName}`,
        );
        return next();
      }

      // We already have the required roles in accessControl
      const requiredRoles = accessControl;

      // If user is not authenticated
      if (!authReq.user) {
        const errorResponse: ErrorResponse = {
          status: 401,
          message: "Authentication required",
          code: "UNAUTHORIZED",
        };
        return res.status(401).json(errorResponse);
      }

      // Check if user has required role
      logger.info(
        `Checking authorization: resource=${resourceName}, action=${action}, requiredRoles=[${requiredRoles.join(",")}], userRole=${authReq.user.role}`,
      );

      // First check if user has a role that matches directly
      if (hasRole(authReq.user.role, requiredRoles)) {
        logger.info(
          `Access granted: User role ${authReq.user.role} in required roles`,
        );
        return next(); // Allow if user has a matching role
      }

      // Then check for owner role if it's included in required roles
      if (requiredRoles.includes("owner") && req.params.id) {
        // Special case: Check if user is the owner of the resource
        const isUserOwner = await isOwner(
          authReq,
          resourceName,
          req.params.id,
          apiConfig,
        );

        logger.info(`Owner check result: ${isUserOwner}`);

        if (isUserOwner) {
          logger.info(`Access granted: User is owner of the resource`);
          return next(); // Allow if user is owner
        }
      }

      // If we get here, access should be denied
      logger.info(`Access denied: Insufficient permissions`);

      // User doesn't have required role
      const errorResponse: ErrorResponse = {
        status: 403,
        message: "Insufficient permissions",
        code: "FORBIDDEN",
      };
      return res.status(403).json(errorResponse);
    };

    // Execute the async function and catch any errors
    runAuthorization().catch((error) => {
      logger.error("Authorization error:", error);
      const errorResponse: ErrorResponse = {
        status: 500,
        message: "Internal server error during authorization",
        code: "INTERNAL_SERVER_ERROR",
      };
      res.status(500).json(errorResponse);
    });
  };
};
