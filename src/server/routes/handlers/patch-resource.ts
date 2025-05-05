import { Request, Response } from "express";
import { DatabaseService, RequestWithUser } from "../../../types/index.js";
import { logger } from "../../../utils/debug-logger.js";
import { getResourceRecordWithOwnershipCheck } from "../utils/update-utils.js";
import { sendOperationError } from "../utils/error-responses.js";
import {
  processHashFields,
  processSpecialFieldsForUpdate,
} from "../../../database/utils/fields/index.js";

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

    // Get resource configuration to process special fields
    const resourceConfigResult = db.getResourceConfig(req.params.resource);
    if (!resourceConfigResult.ok) {
      return sendOperationError(
        res,
        "patch",
        resourceConfigResult.error.message,
        400,
      );
    }

    // Get existing records for potential special field processing
    const existingRecordsResult = await resource.findAll();
    const existingRecords = existingRecordsResult.ok
      ? existingRecordsResult.value
      : [];

    // Get the user ID for userId special field
    const userId = (req as unknown as RequestWithUser).user?.id;

    // Process special fields that need updating (e.g., $now for updatedAt)
    const dataWithSpecialFields = processSpecialFieldsForUpdate(
      req.body,
      resourceConfigResult.value.fields,
      existingRecords,
      userId,
    );

    // Process password hash fields if present in the update
    const dataToUpdate = processHashFields(
      dataWithSpecialFields,
      resourceConfigResult.value.fields,
    );

    logger.info(
      `Patching resource with processed fields: ${JSON.stringify(dataToUpdate)}`,
    );

    // Update the record (partial update)
    const result = await resource.patch(id, dataToUpdate);
    if (!result.ok) {
      // Check if the error is a validation error
      const errorMessage = result.error.message;
      if (errorMessage.includes("Validation failed")) {
        return sendOperationError(res, "patch", errorMessage, 400);
      }
      return sendOperationError(res, "patch", errorMessage, 500);
    }

    // Return the updated record
    res.json({ data: result.value });
  };
};
