import { Request, Response } from "express";
import { DatabaseService } from "../../../types/index.js";
import { parseResourceId } from "../utils/request-utils.js";
import { getResourceOrError } from "../utils/resource-utils.js";
import { checkOwnership } from "../utils/request-utils.js";
import {
  sendForbiddenOwnershipError,
  sendOperationError,
  sendRecordNotFoundError,
} from "../utils/error-responses.js";

/**
 * Handler for GET /:resource/:id
 * Returns a single resource by ID with optional relationship expansion
 */
export const getResourceByIdHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    const resourceName = req.params.resource;
    const id = req.params.id;

    // Try to parse id as number if possible
    const resourceId = parseResourceId(id);

    // Get the resource
    const resourceResult = await getResourceOrError(req, res, db);
    if (!resourceResult.ok) {
      return; // Error response already sent
    }

    const resource = resourceResult.value;

    // Get the record
    const result = await resource.findById(resourceId);
    if (!result.ok) {
      return sendOperationError(res, "retrieve", result.error.message, 500);
    }

    if (!result.value) {
      return sendRecordNotFoundError(res, resourceName, id);
    }

    // Check ownership if needed
    const ownershipPassed = checkOwnership(req, result.value, {
      logContext: "get-by-id",
    });

    if (!ownershipPassed) {
      const { strictOwnerCheck } = req as { strictOwnerCheck?: boolean };
      return sendForbiddenOwnershipError(res, !!strictOwnerCheck);
    }

    // Handle relationship expansion if requested
    let data = result.value;
    const expand = req.query.expand;

    if (expand) {
      // Handle expand as string or array
      const _expandFields = Array.isArray(expand)
        ? expand.flatMap((e) => String(e).split(","))
        : String(expand).split(",");

      // TODO: Implement relationship expansion for single resource
      // This is a placeholder for future implementation
    }

    // Return the resource
    res.json({ data });
  };
};
