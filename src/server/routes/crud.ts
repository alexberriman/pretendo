import { Request, Response } from "express";
import {
  DatabaseService,
  ErrorResponse,
  PaginationMeta,
  QueryOptions,
} from "../../types/index.js";
import { parseQueryOptions } from "../../database/query.js";

// Create pagination metadata
const createPaginationMeta = (
  currentPage: number,
  perPage: number,
  totalItems: number,
  baseUrl: string,
): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / perPage);

  const links: Record<string, string> = {};

  // Parse the base URL
  const url = new URL(baseUrl);

  // First page
  const firstPageUrl = new URL(url.toString());
  firstPageUrl.searchParams.set("page", "1");
  firstPageUrl.searchParams.set("perPage", perPage.toString());
  links.first = firstPageUrl.toString();

  // Last page
  const lastPageUrl = new URL(url.toString());
  lastPageUrl.searchParams.set("page", totalPages.toString());
  lastPageUrl.searchParams.set("perPage", perPage.toString());
  links.last = lastPageUrl.toString();

  // Previous page
  if (currentPage > 1) {
    const prevPageUrl = new URL(url.toString());
    prevPageUrl.searchParams.set("page", (currentPage - 1).toString());
    prevPageUrl.searchParams.set("perPage", perPage.toString());
    links.prev = prevPageUrl.toString();
  }

  // Next page
  if (currentPage < totalPages) {
    const nextPageUrl = new URL(url.toString());
    nextPageUrl.searchParams.set("page", (currentPage + 1).toString());
    nextPageUrl.searchParams.set("perPage", perPage.toString());
    links.next = nextPageUrl.toString();
  }

  return {
    currentPage,
    perPage,
    totalPages,
    totalItems,
    links,
  };
};

// Get base URL from request
const getBaseUrl = (req: Request): string => {
  const host = req.headers.host || "localhost";
  return `${req.protocol}://${host}${req.baseUrl}${req.path}`;
};

// Handler for GET /:resource
export const getResourcesHandler = (
  db: DatabaseService,
  defaultPageSize: number,
  maxPageSize: number,
) => {
  return async (req: Request, res: Response) => {
    const resourceName = req.params.resource;

    // Get the resource operations
    const resourceResult = db.getResource(resourceName);
    if (!resourceResult.ok) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: `Resource '${resourceName}' not found`,
        code: "RESOURCE_NOT_FOUND",
      };
      return res.status(404).json(errorResponse);
    }

    const resource = resourceResult.value;

    // Parse query options - convert express query to compatible record
    const queryOptions = parseQueryOptions(
      req.query as Record<string, string | string[] | undefined>,
    );

    // Apply pagination defaults and limits
    queryOptions.page = queryOptions.page || 1;
    queryOptions.perPage = queryOptions.perPage || defaultPageSize;

    // Enforce max page size
    if (queryOptions.perPage > maxPageSize) {
      queryOptions.perPage = maxPageSize;
    }

    // Get total count first (without pagination)
    const countOptions: QueryOptions = { ...queryOptions };
    delete countOptions.page;
    delete countOptions.perPage;

    const totalCountResult = await resource.findAll(countOptions);
    if (!totalCountResult.ok) {
      const errorResponse: ErrorResponse = {
        status: 500,
        message: "Failed to retrieve resources",
        details: totalCountResult.error.message,
      };
      return res.status(500).json(errorResponse);
    }

    const totalCount = totalCountResult.value.length;

    // Get paginated results
    const result = await resource.findAll(queryOptions);
    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        status: 500,
        message: "Failed to retrieve resources",
        details: result.error.message,
      };
      return res.status(500).json(errorResponse);
    }

    // Create pagination metadata
    const pagination = createPaginationMeta(
      queryOptions.page,
      queryOptions.perPage,
      totalCount,
      getBaseUrl(req),
    );

    // Set Link header (RFC 5988)
    const linkHeader = Object.entries(pagination.links)
      .map(([rel, url]) => `<${url}>; rel="${rel}"`)
      .join(", ");

    res.setHeader("Link", linkHeader);
    res.setHeader("X-Total-Count", totalCount.toString());

    // Return data with metadata
    res.json({
      data: result.value,
      meta: {
        pagination,
      },
    });
  };
};

// Handler for GET /:resource/:id
export const getResourceByIdHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    const resourceName = req.params.resource;
    const id = req.params.id;

    // Try to parse id as number if possible
    const resourceId = !isNaN(Number(id)) ? Number(id) : id;

    // Get the resource operations
    const resourceResult = db.getResource(resourceName);
    if (!resourceResult.ok) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: `Resource '${resourceName}' not found`,
        code: "RESOURCE_NOT_FOUND",
      };
      return res.status(404).json(errorResponse);
    }

    const resource = resourceResult.value;

    // Get the record
    const result = await resource.findById(resourceId);
    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        status: 500,
        message: "Failed to retrieve resource",
        details: result.error.message,
      };
      return res.status(500).json(errorResponse);
    }

    if (!result.value) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: `${resourceName} with id ${id} not found`,
        code: "RECORD_NOT_FOUND",
      };
      return res.status(404).json(errorResponse);
    }

    // Handle relationship expansion if requested
    let data = result.value;
    const expand = req.query.expand;

    if (expand) {
      // Handle expand as string or array
      const _expandFields = Array.isArray(expand)
        ? expand.flatMap((e) => String(e).split(","))
        : String(expand).split(",");

      // TODO: Implement relationship expansion for single resource

      // For now, just return the record
      res.json({ data });
    } else {
      res.json({ data });
    }
  };
};

// Handler for POST /:resource
export const createResourceHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    const resourceName = req.params.resource;

    // Get the resource operations
    const resourceResult = db.getResource(resourceName);
    if (!resourceResult.ok) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: `Resource '${resourceName}' not found`,
        code: "RESOURCE_NOT_FOUND",
      };
      return res.status(404).json(errorResponse);
    }

    const resource = resourceResult.value;

    // Create the record
    const result = await resource.create(req.body);
    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        status: 400,
        message: "Failed to create resource",
        details: result.error.message,
      };
      return res.status(400).json(errorResponse);
    }

    // Return the created record with 201 status
    res.status(201).json({ data: result.value });
  };
};

// Handler for PUT /:resource/:id
export const updateResourceHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    const resourceName = req.params.resource;
    const id = req.params.id;

    // Try to parse id as number if possible
    const resourceId = !isNaN(Number(id)) ? Number(id) : id;

    // Get the resource operations
    const resourceResult = db.getResource(resourceName);
    if (!resourceResult.ok) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: `Resource '${resourceName}' not found`,
        code: "RESOURCE_NOT_FOUND",
      };
      return res.status(404).json(errorResponse);
    }

    const resource = resourceResult.value;

    // Update the record (full replace)
    const result = await resource.update(resourceId, req.body);
    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        status: 500,
        message: "Failed to update resource",
        details: result.error.message,
      };
      return res.status(500).json(errorResponse);
    }

    if (!result.value) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: `${resourceName} with id ${id} not found`,
        code: "RECORD_NOT_FOUND",
      };
      return res.status(404).json(errorResponse);
    }

    // Return the updated record
    res.json({ data: result.value });
  };
};

// Handler for PATCH /:resource/:id
export const patchResourceHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    const resourceName = req.params.resource;
    const id = req.params.id;

    // Try to parse id as number if possible
    const resourceId = !isNaN(Number(id)) ? Number(id) : id;

    // Get the resource operations
    const resourceResult = db.getResource(resourceName);
    if (!resourceResult.ok) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: `Resource '${resourceName}' not found`,
        code: "RESOURCE_NOT_FOUND",
      };
      return res.status(404).json(errorResponse);
    }

    const resource = resourceResult.value;

    // Update the record (partial update)
    const result = await resource.patch(resourceId, req.body);
    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        status: 500,
        message: "Failed to patch resource",
        details: result.error.message,
      };
      return res.status(500).json(errorResponse);
    }

    if (!result.value) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: `${resourceName} with id ${id} not found`,
        code: "RECORD_NOT_FOUND",
      };
      return res.status(404).json(errorResponse);
    }

    // Return the updated record
    res.json({ data: result.value });
  };
};

// Handler for DELETE /:resource/:id
export const deleteResourceHandler = (db: DatabaseService) => {
  return async (req: Request, res: Response) => {
    const resourceName = req.params.resource;
    const id = req.params.id;

    // Try to parse id as number if possible
    const resourceId = !isNaN(Number(id)) ? Number(id) : id;

    // Get the resource operations
    const resourceResult = db.getResource(resourceName);
    if (!resourceResult.ok) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: `Resource '${resourceName}' not found`,
        code: "RESOURCE_NOT_FOUND",
      };
      return res.status(404).json(errorResponse);
    }

    const resource = resourceResult.value;

    // Delete the record
    const result = await resource.delete(resourceId);
    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        status: 500,
        message: "Failed to delete resource",
        details: result.error.message,
      };
      return res.status(500).json(errorResponse);
    }

    if (!result.value) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: `${resourceName} with id ${id} not found`,
        code: "RECORD_NOT_FOUND",
      };
      return res.status(404).json(errorResponse);
    }

    // Return 204 No Content
    res.status(204).end();
  };
};
