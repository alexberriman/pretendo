import { Request, Response } from "express";
import {
  DatabaseService,
  ResourceOperation,
  Result,
} from "../../../types/index.js";
import { sendResourceNotFoundError } from "./error-responses.js";

/**
 * Gets a resource from the database service
 * Returns the resource or sends a not found error response
 */
export const getResourceOrError = async (
  req: Request,
  res: Response,
  db: DatabaseService,
): Promise<Result<ResourceOperation, null>> => {
  const resourceName = req.params.resource;

  // Get the resource operations
  const resourceResult = db.getResource(resourceName);

  if (!resourceResult.ok) {
    sendResourceNotFoundError(res, resourceName);
    return { ok: false, error: null };
  }

  return { ok: true, value: resourceResult.value };
};
