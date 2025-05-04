import {
  Router,
  RequestHandler,
  Request,
  Response,
  NextFunction,
} from "express";
import {
  ApiOptions,
  DatabaseService,
  RequestWithUser,
  RequestWithApiConfig,
} from "../../types/index.js";
import { logger } from "../../utils/debug-logger.js";
import {
  createResourceHandler,
  deleteResourceHandler,
  getResourceByIdHandler,
  getResourcesHandler,
  patchResourceHandler,
  updateResourceHandler,
} from "./crud.js";
import { getRelatedResourcesHandler } from "./relationships.js";
import { loginHandler, logoutHandler } from "./auth.js";
import { backupHandler, resetHandler, restoreHandler } from "./admin.js";
import { AuthService } from "../middleware/auth.js";

export const createRoutes = (
  db: DatabaseService,
  options: ApiOptions,
  authService: AuthService,
): Router => {
  const router = Router();

  const defaultPageSize = options.defaultPageSize || 10;
  const maxPageSize = options.maxPageSize || 100;

  // Custom middleware to check resource-level access in RBAC
  // Define the middleware as a regular function first
  const rbacMiddlewareImpl = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void | Response => {
    // Need to cast req to include the properties we're using
    const typedReq = req as Request &
      RequestWithUser &
      RequestWithApiConfig & {
        ownerCheckOnly?: boolean;
        ownershipCheckRequired?: boolean;
      };
    // If auth not enabled, just skip
    if (!options.auth?.enabled) {
      return next();
    }

    const resourceName = typedReq.params.resource;
    if (!resourceName) {
      return next();
    }

    // Find the resource configuration from server config, not from options which might not have resources
    // The apiConfig that's passed to this router creator doesn't have all the resources directly
    // We need to search through the real resources from the main config
    const resources = typedReq.apiConfig?.resources || [];
    const resource = resources.find((r) => r.name === resourceName);

    logger.info(`RBAC Check for resource: ${resourceName}`, {
      hasResource: !!resource,
      hasAccess: !!resource?.access,
      resourceConfig: resource,
    });

    if (!resource || !resource.access) {
      return next();
    }

    // Check if user is authenticated
    const user = typedReq.user;
    if (!user) {
      return res.status(401).json({
        status: 401,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    // Determine action from method
    let action;
    switch (typedReq.method) {
      case "GET":
        action = typedReq.params.id ? "get" : "list";
        break;
      case "POST":
        action = "create";
        break;
      case "PUT":
      case "PATCH":
        action = "update";
        break;
      case "DELETE":
        action = "delete";
        break;
      default:
        return next();
    }

    // Get required roles
    const requiredRoles =
      resource.access[action as keyof typeof resource.access];
    if (
      !requiredRoles ||
      !Array.isArray(requiredRoles) ||
      requiredRoles.length === 0
    ) {
      return next();
    }

    logger.info(
      `RBAC Check: resource=${resourceName}, action=${action}, requiredRoles=${requiredRoles.join(",")}, userRole=${user.role}`,
    );

    // Wildcard check
    if (requiredRoles.includes("*")) {
      logger.info("Access granted via wildcard");
      return next();
    }

    // Owner check - we need to check ownership if the role includes 'owner'
    const isOwnerCheck =
      requiredRoles.includes("owner") && typedReq.params.id && resource.ownedBy;

    // If owner check is needed, we need to check if the user is the owner
    if (isOwnerCheck) {
      // Safe to use user.id now since we've already checked for user existence
      const userId = user.id;
      const userRole = user.role;
      const resourceId = typedReq.params.id;
      const ownerField = resource.ownedBy;

      logger.info(
        `Owner check needed: userId=${userId}, userRole=${userRole}, resourceId=${resourceId}, ownerField=${ownerField}`,
      );

      // For now, we'll pass a flag to later middleware to check ownership
      // because we don't have DB access here to check if the resource is owned by user
      typedReq.ownershipCheckRequired = true;

      // For users that have an explicitly allowed role like 'admin', allow them regardless
      if (
        userRole &&
        requiredRoles.filter((r) => r !== "owner").includes(userRole)
      ) {
        logger.info(
          `User has explicit role (${userRole}) access, bypassing ownership check`,
        );
        return next();
      }

      // For role-only check (like just 'admin' without 'owner'), we've already handled above
      // For owner-only check (just 'owner' in the role list), we'll need to let it through and check in the handler
      if (requiredRoles.includes("owner")) {
        logger.info(
          "Owner role included in required roles, passing to handler for DB check",
        );
        // Special flag for owner check - needed for all CRUD handlers
        typedReq.ownerCheckOnly = true;

        // If this check is ONLY for owner (no other roles that would allow access),
        // make it extra strict with another flag
        if (requiredRoles.length === 1 && requiredRoles[0] === "owner") {
          logger.info(
            "STRICT owner check required - only owner can access this resource",
          );
          typedReq.strictOwnerCheck = true;
        }

        return next();
      }
    }

    // Check role match
    if (user.role && requiredRoles.includes(user.role)) {
      logger.info("Access granted via role match");
      return next();
    }

    // For owner-only roles (such as user self-management),
    // we need to strictly enforce the ownership in all operations
    // If this check is ONLY for owner (no other roles that would allow access),
    // make it extra strict with another flag
    if (
      isOwnerCheck &&
      requiredRoles.length === 1 &&
      requiredRoles[0] === "owner"
    ) {
      logger.info("STRICT owner check required - enforcing in request chain");

      // For operations that target a specific ID, check if the ID matches the user's ID
      // This is a preliminary check before the handler runs
      if (typedReq.params.id && user.id) {
        const requestedId = typedReq.params.id;
        const userId = String(user.id);

        // For direct self-management (like users resource), we can do a simple check
        // to avoid letting the request through if it's obviously not the owner
        if (resourceName === "users") {
          // For users self-management, we can directly compare IDs
          // Convert both to strings to handle numeric vs string ID variations
          const parsedRequestedId = String(requestedId).trim();
          const parsedUserId = String(userId).trim();

          logger.info(
            `Direct user ID check: requested=${parsedRequestedId}, userId=${parsedUserId}`,
          );

          if (parsedRequestedId !== parsedUserId) {
            logger.info(`Direct user ID mismatch - FORBIDDEN`);
            return res.status(403).json({
              status: 403,
              message: "Insufficient permissions - not the owner",
              code: "FORBIDDEN_NOT_OWNER",
            });
          } else {
            logger.info(`Direct user ID match - access granted`);
          }
        }
      }

      // For other resources, let the handler do the DB check
      typedReq.strictOwnerCheck = true;
      typedReq.ownerCheckOnly = true;
      logger.info(
        "Only owner role required, passing to handler with strict checks",
      );
      return next();
    }

    // Access denied
    logger.info("Access denied");
    return res.status(403).json({
      status: 403,
      message: "Insufficient permissions",
      code: "FORBIDDEN",
    });
  };

  // Cast to RequestHandler for use in Express routes
  const rbacMiddleware = rbacMiddlewareImpl as RequestHandler;

  // CRUD routes for resources
  router.get(
    "/:resource",
    rbacMiddleware,
    getResourcesHandler(db, defaultPageSize, maxPageSize) as RequestHandler,
  );
  router.get(
    "/:resource/:id",
    rbacMiddleware,
    getResourceByIdHandler(db) as RequestHandler,
  );
  router.post(
    "/:resource",
    rbacMiddleware,
    createResourceHandler(db) as RequestHandler,
  );
  router.put(
    "/:resource/:id",
    rbacMiddleware,
    updateResourceHandler(db) as RequestHandler,
  );
  router.patch(
    "/:resource/:id",
    rbacMiddleware,
    patchResourceHandler(db) as RequestHandler,
  );
  router.delete(
    "/:resource/:id",
    rbacMiddleware,
    deleteResourceHandler(db) as RequestHandler,
  );

  // Relationship routes
  router.get(
    "/:resource/:id/:relationship",
    getRelatedResourcesHandler(
      db,
      defaultPageSize,
      maxPageSize,
    ) as RequestHandler,
  );

  // Auth routes
  if (options.auth?.enabled) {
    const authEndpoint = options.auth.authEndpoint || "/auth/login";

    // Strip leading slash if present
    const authPath = authEndpoint.startsWith("/")
      ? authEndpoint.substring(1)
      : authEndpoint;

    router.post(
      `/${authPath}`,
      loginHandler(authService, options, db) as RequestHandler,
    );
    router.post(
      "/auth/logout",
      logoutHandler(authService, options) as RequestHandler,
    );
  }

  // Admin routes
  router.post("/__reset", resetHandler(db) as RequestHandler);
  router.post("/__backup", backupHandler(db) as RequestHandler);
  router.post("/__restore", restoreHandler(db) as RequestHandler);

  return router;
};
