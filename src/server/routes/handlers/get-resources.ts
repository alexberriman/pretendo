import { Request, Response } from "express";
import { DatabaseService } from "../../../types/index.js";
import { parseQueryOptions } from "../../../database/query.js";
import {
  applyPaginationDefaults,
  createCountOptions,
  setPaginationHeaders,
} from "../utils/pagination-utils.js";
import { getResourceOrError } from "../utils/resource-utils.js";
import { sendOperationError } from "../utils/error-responses.js";

/**
 * Handler for GET /:resource
 * Returns a paginated list of resources with filtering, sorting, and pagination
 */
export const getResourcesHandler = (
  db: DatabaseService,
  defaultPageSize: number,
  maxPageSize: number,
) => {
  return async (req: Request, res: Response) => {
    // Get the resource
    const resourceResult = await getResourceOrError(req, res, db);
    if (!resourceResult.ok) {
      return; // Error response already sent
    }

    const resource = resourceResult.value;

    // Parse query options - convert express query to compatible record
    const queryOptions = parseQueryOptions(
      req.query as Record<string, string | string[] | undefined>,
    );

    // Apply pagination defaults and limits
    applyPaginationDefaults(queryOptions, defaultPageSize, maxPageSize);

    // Get total count first (without pagination)
    const countOptions = createCountOptions(queryOptions);

    const totalCountResult = await resource.findAll(countOptions);
    if (!totalCountResult.ok) {
      return sendOperationError(
        res,
        "retrieve",
        totalCountResult.error.message,
        500,
      );
    }

    const totalCount = totalCountResult.value.length;

    // Get paginated results
    const result = await resource.findAll(queryOptions);
    if (!result.ok) {
      return sendOperationError(res, "retrieve", result.error.message, 500);
    }

    // Set pagination headers
    const pagination = setPaginationHeaders(
      req,
      res,
      queryOptions.page || 1,
      queryOptions.perPage || defaultPageSize,
      totalCount,
    );

    // Return data with metadata
    res.json({
      data: result.value,
      meta: {
        pagination,
      },
    });
  };
};
