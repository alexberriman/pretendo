import { Request, Response } from "express";
import { DatabaseService } from "../../../types/index.js";
import { logger } from "../../../utils/debug-logger.js";
import { getResourceRecordWithOwnershipCheck } from "../utils/update-utils.js";
import { sendOperationError } from "../utils/error-responses.js";

/**
 * Handler for PATCH /:resource/:id
 * Partially updates a resource with new data
 */
export const patchResourceHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    // Get resource, check it exists, and verify ownership
    const resourceResult = await getResourceRecordWithOwnershipCheck(
      req,
      res,
      db,
      {
        operation: "patch",
        logContext: "patch",
      },
    );

    if (!resourceResult.ok) {
      return; // Error response already sent
    }

    const { resource, id } = resourceResult.value;

    // Additional access log for debugging
    logger.info(`PATCH operation - resourceId=${id}, access granted`);

    // Update the record (partial update)
    const result = await resource.patch(id, req.body);
    if (!result.ok) {
      return sendOperationError(res, "patch", result.error.message, 500);
    }

    // Return the updated record
    res.json({ data: result.value });
  };
};
