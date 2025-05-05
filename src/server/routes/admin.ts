import { Request, Response } from "express";
import {
  DatabaseService,
  ErrorResponse,
  ApiOptions,
  RequestWithApiConfig,
} from "../../types/index.js";
import { convertToOpenApi, convertToYaml } from "../../utils/openapi/index.js";
import { logger } from "../../utils/debug-logger.js";

// Handler for POST /__reset
export const resetHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    const result = await db.reset();

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        status: 500,
        message: "Failed to reset database",
        details: result.error.message,
      };
      return res.status(500).json(errorResponse);
    }

    res.status(204).end();
  };
};

// Handler for POST /__backup
export const backupHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    const path = req.body.path;

    const result = await db.backup(path);

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        status: 500,
        message: "Failed to backup database",
        details: result.error.message,
      };
      return res.status(500).json(errorResponse);
    }

    res.json({ path: result.value });
  };
};

// Handler for POST /__restore
export const restoreHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    const path = req.body.path;

    if (!path) {
      const errorResponse: ErrorResponse = {
        status: 400,
        message: "Path parameter is required",
        code: "INVALID_REQUEST",
      };
      return res.status(400).json(errorResponse);
    }

    const result = await db.restore(path);

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        status: 500,
        message: "Failed to restore database",
        details: result.error.message,
      };
      return res.status(500).json(errorResponse);
    }

    res.status(204).end();
  };
};

// Handler for GET /__docs
export const apiDocsHandler = (options: ApiOptions) => {
  return (req: Request, res: Response) => {
    try {
      const typedReq = req as Request &
        RequestWithApiConfig & {
          user?: { id: string | number; username: string; role?: string };
        };
      const apiConfig = typedReq.apiConfig;

      if (!apiConfig) {
        const errorResponse: ErrorResponse = {
          status: 500,
          message: "API configuration not available",
          code: "SERVER_ERROR",
        };
        return res.status(500).json(errorResponse);
      }

      // Check if docs are enabled
      const isProduction = process.env.NODE_ENV === "production";
      const docsEnabled = options.docs?.enabled ?? !isProduction;
      const requireAuth = options.docs?.requireAuth ?? isProduction;

      if (!docsEnabled) {
        const errorResponse: ErrorResponse = {
          status: 404,
          message: "API documentation is not available",
          code: "NOT_FOUND",
        };
        return res.status(404).json(errorResponse);
      }

      // Check authentication if required
      if (requireAuth && options.auth?.enabled) {
        // If no user is authenticated, deny access
        if (!typedReq.user) {
          const errorResponse: ErrorResponse = {
            status: 401,
            message: "Authentication required to access API documentation",
            code: "UNAUTHORIZED",
          };
          return res.status(401).json(errorResponse);
        }

        // If user doesn't have admin role, deny access
        if (typedReq.user.role !== "admin") {
          const errorResponse: ErrorResponse = {
            status: 403,
            message: "Admin role required to access API documentation",
            code: "FORBIDDEN",
          };
          return res.status(403).json(errorResponse);
        }
      }

      // Generate OpenAPI spec
      const openApiSpec = convertToOpenApi(apiConfig);

      // Check for format query parameter
      const format = (req.query.format as string)?.toLowerCase();
      if (format === "yaml") {
        const yamlSpec = convertToYaml(openApiSpec);
        res.setHeader("Content-Type", "text/yaml");
        return res.send(yamlSpec);
      }

      // Default to JSON format
      res.json(openApiSpec);
    } catch (error) {
      logger.error("Error generating OpenAPI documentation:", error);
      const errorResponse: ErrorResponse = {
        status: 500,
        message: "Failed to generate API documentation",
        details: (error as Error).message,
      };
      res.status(500).json(errorResponse);
    }
  };
};
