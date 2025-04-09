import { Router } from "express";
import { ApiOptions, DatabaseService } from "../../types/index.js";
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

  // CRUD routes for resources
  router.get(
    "/:resource",
    getResourcesHandler(db, defaultPageSize, maxPageSize),
  );
  router.get("/:resource/:id", getResourceByIdHandler(db));
  router.post("/:resource", createResourceHandler(db));
  router.put("/:resource/:id", updateResourceHandler(db));
  router.patch("/:resource/:id", patchResourceHandler(db));
  router.delete("/:resource/:id", deleteResourceHandler(db));

  // Relationship routes
  router.get(
    "/:resource/:id/:relationship",
    getRelatedResourcesHandler(db, defaultPageSize, maxPageSize),
  );

  // Auth routes
  if (options.auth?.enabled) {
    const authEndpoint = options.auth.authEndpoint || "/auth/login";

    // Strip leading slash if present
    const authPath = authEndpoint.startsWith("/")
      ? authEndpoint.substring(1)
      : authEndpoint;

    router.post(`/${authPath}`, loginHandler(authService, options));
    router.post("/auth/logout", logoutHandler(authService, options));
  }

  // Admin routes
  router.post("/__reset", resetHandler(db));
  router.post("/__backup", backupHandler(db));
  router.post("/__restore", restoreHandler(db));

  return router;
};
