import { Request, Response } from "express";
import { DatabaseService } from "../../../types/index.js";
import { logger } from "../../../utils/debug-logger.js";
import { handleOwnershipAssignment } from "../utils/ownership-utils.js";
import { getResourceOrError } from "../utils/resource-utils.js";
import { sendOperationError } from "../utils/error-responses.js";

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

    const dataToCreate = await handleOwnershipAssignment(req, db, req.body);

    // Create the record
    const result = await resource.create(dataToCreate);
    if (!result.ok) {
      return sendOperationError(res, "create", result.error.message, 400);
    }

    // Return the created record with 201 status
    res.status(201).json({ data: result.value });
  };
};
