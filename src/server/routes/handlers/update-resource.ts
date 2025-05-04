import { Request, Response } from "express";
import { DatabaseService } from "../../../types/index.js";
import { logger } from "../../../utils/debug-logger.js";
import { getResourceRecordWithOwnershipCheck } from "../utils/update-utils.js";
import { sendOperationError } from "../utils/error-responses.js";

/**
 * Handler for PUT /:resource/:id
 * Completely replaces a resource with new data
 */
export const updateResourceHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    // Get resource, check it exists, and verify ownership
    const resourceResult = await getResourceRecordWithOwnershipCheck(
      req,
      res,
      db,
      {
        operation: "update",
        logContext: "update",
      },
    );

    if (!resourceResult.ok) {
      return; // Error response already sent
    }

    const { resource, id } = resourceResult.value;

    logger.info(`Performing update on resource with id ${id}`);

    // Update the record (full replace)
    const result = await resource.update(id, req.body);
    if (!result.ok) {
      return sendOperationError(res, "update", result.error.message, 500);
    }

    // Return the updated record
    res.json({ data: result.value });
  };
};
