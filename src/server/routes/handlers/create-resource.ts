import { Request, Response } from "express";
import { DatabaseService, RequestWithUser } from "../../../types/index.js";
import { logger } from "../../../utils/debug-logger.js";
import { handleOwnershipAssignment } from "../utils/ownership-utils.js";
import { getResourceOrError } from "../utils/resource-utils.js";
import { sendOperationError } from "../utils/error-responses.js";
import {
  processHashFields,
  processSpecialFields,
} from "../../../database/utils/fields/index.js";

/**
 * Handler for POST /:resource
 * Creates a new resource with automatic ownership assignment
 */
export const createResourceHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    const resourceName = req.params.resource;

    // Get the resource
    const resourceResult = await getResourceOrError(req, res, db);
    if (!resourceResult.ok) {
      return; // Error response already sent
    }

    const resource = resourceResult.value;

    // Handle automatic owner assignment
    logger.info(
      `Creating resource '${resourceName}' with payload: ${JSON.stringify(req.body)}`,
    );

    const dataWithOwnership = await handleOwnershipAssignment(
      req,
      db,
      req.body,
    );

    // Get resource configuration to process special fields
    const resourceConfigResult = db.getResourceConfig(resourceName);
    if (!resourceConfigResult.ok) {
      return sendOperationError(
        res,
        "create",
        resourceConfigResult.error.message,
        400,
      );
    }

    // Get existing records to check for auto-incrementing fields
    const existingRecordsResult = await resource.findAll();
    const existingRecords = existingRecordsResult.ok
      ? existingRecordsResult.value
      : [];

    // Get the user ID for userId special field
    const userId = (req as unknown as RequestWithUser).user?.id;

    // Process special fields (like $now, $uuid, $userId, $increment)
    const dataWithSpecialFields = processSpecialFields(
      dataWithOwnership,
      resourceConfigResult.value.fields,
      existingRecords,
      undefined, // Use default INSERT mode
      userId,
    );

    // Process password hash fields
    const dataToCreate = processHashFields(
      dataWithSpecialFields,
      resourceConfigResult.value.fields,
    );

    logger.info(
      `Creating resource with processed fields: ${JSON.stringify(dataToCreate)}`,
    );

    // Create the record
    const result = await resource.create(dataToCreate);
    if (!result.ok) {
      return sendOperationError(res, "create", result.error.message, 400);
    }

    // Return the created record with 201 status
    res.status(201).json({ data: result.value });
  };
};
