import { Request, Response } from "express";
import {
  DatabaseService,
  ResourceOperation,
  Result,
} from "../../../types/index.js";
import { parseResourceId } from "./request-utils.js";
import { getResourceOrError } from "./resource-utils.js";
import { checkOwnership } from "./request-utils.js";
import {
  sendForbiddenOwnershipError,
  sendOperationError,
  sendRecordNotFoundError,
} from "./error-responses.js";

/**
 * Shared logic for update and delete operations
 * Gets a resource by ID and performs ownership checks
 */
export const getResourceRecordWithOwnershipCheck = async (
  req: Request,
  res: Response,
  db: DatabaseService,
  options: {
    operation: string;
    logContext: string;
  },
): Promise<
  Result<
    {
      resource: ResourceOperation;
      id: string | number;
      record: Record<string, unknown>;
    },
    null
  >
> => {
  const resourceName = req.params.resource;
  const id = req.params.id;

  // Try to parse id as number if possible
  const resourceId = parseResourceId(id);

  // Get the resource
  const resourceResult = await getResourceOrError(req, res, db);
  if (!resourceResult.ok) {
    return { ok: false, error: null }; // Error response already sent
  }

  const resource = resourceResult.value;

  // Get the record first to check ownership
  const getResult = await resource.findById(resourceId);
  if (!getResult.ok) {
    sendOperationError(res, options.operation, getResult.error.message, 500);
    return { ok: false, error: null };
  }

  if (!getResult.value) {
    sendRecordNotFoundError(res, resourceName, id);
    return { ok: false, error: null };
  }

  // Check ownership if needed
  const ownershipPassed = checkOwnership(req, getResult.value, {
    logContext: options.logContext,
  });

  if (!ownershipPassed) {
    const { strictOwnerCheck } = req as { strictOwnerCheck?: boolean };
    sendForbiddenOwnershipError(res, !!strictOwnerCheck);
    return { ok: false, error: null };
  }

  return {
    ok: true,
    value: {
      resource,
      id: resourceId,
      record: getResult.value,
    },
  };
};
