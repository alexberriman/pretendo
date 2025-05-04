import { Request, Response } from "express";
import { DatabaseService } from "../../../types/index.js";
import { logger } from "../../../utils/debug-logger.js";
import { getResourceRecordWithOwnershipCheck } from "../utils/update-utils.js";
import { sendOperationError } from "../utils/error-responses.js";

/**
 * Handler for DELETE /:resource/:id
 * Deletes a resource by ID
 */
export const deleteResourceHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    // Get resource, check it exists, and verify ownership
    const resourceResult = await getResourceRecordWithOwnershipCheck(
      req,
      res,
      db,
      {
        operation: "delete",
        logContext: "delete",
      },
    );

    if (!resourceResult.ok) {
      return; // Error response already sent
    }

    const { resource, id } = resourceResult.value;

    logger.info(`DELETE operation - resourceId=${id}, access granted`);

    // Delete the record
    const result = await resource.delete(id);
    if (!result.ok) {
      return sendOperationError(res, "delete", result.error.message, 500);
    }

    // Return 204 No Content
    res.status(204).end();
  };
};
