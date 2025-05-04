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

    // Get resource configuration to process special fields
    const resourceConfigResult = db.getResourceConfig(req.params.resource);
    if (!resourceConfigResult.ok) {
      return sendOperationError(
        res,
        "update",
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
      `Updating resource with processed fields: ${JSON.stringify(dataToUpdate)}`,
    );

    // Update the record (full replace)
    const result = await resource.update(id, dataToUpdate);
    if (!result.ok) {
      return sendOperationError(res, "update", result.error.message, 500);
    }

    // Return the updated record
    res.json({ data: result.value });
  };
};
