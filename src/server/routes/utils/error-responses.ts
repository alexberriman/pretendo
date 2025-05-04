import { Response } from "express";
import { ErrorResponse } from "../../../types/index.js";

/**
 * Sends a resource not found error response
 */
export const sendResourceNotFoundError = (
  res: Response,
  resourceName: string,
): void => {
  const errorResponse: ErrorResponse = {
    status: 404,
    message: `Resource '${resourceName}' not found`,
    code: "RESOURCE_NOT_FOUND",
  };
  res.status(404).json(errorResponse);
};

/**
 * Sends a record not found error response
 */
export const sendRecordNotFoundError = (
  res: Response,
  resourceName: string,
  id: string | number,
): void => {
  const errorResponse: ErrorResponse = {
    status: 404,
    message: `${resourceName} with id ${id} not found`,
    code: "RECORD_NOT_FOUND",
  };
  res.status(404).json(errorResponse);
};

/**
 * Sends a forbidden error response due to ownership checks
 */
export const sendForbiddenOwnershipError = (
  res: Response,
  isStrictCheck: boolean = false,
): void => {
  const message = isStrictCheck
    ? "Insufficient permissions - strict owner check failed"
    : "Insufficient permissions - not the owner";

  const code = isStrictCheck ? "FORBIDDEN_STRICT_OWNER" : "FORBIDDEN_NOT_OWNER";

  res.status(403).json({
    status: 403,
    message,
    code,
  });
};

/**
 * Sends a general operation error response
 */
export const sendOperationError = (
  res: Response,
  operation: string,
  details: string,
  status: number = 500,
): void => {
  const errorResponse: ErrorResponse = {
    status,
    message: `Failed to ${operation} resource`,
    details,
  };
  res.status(status).json(errorResponse);
};
