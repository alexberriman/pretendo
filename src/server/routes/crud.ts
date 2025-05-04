import { Request, Response } from "express";
import {
  DatabaseService,
  ErrorResponse,
  PaginationMeta,
  QueryOptions,
  RequestWithApiConfig,
  RequestWithResource,
  RequestWithUser,
} from "../../types/index.js";
import { parseQueryOptions } from "../../database/query.js";
import { logger } from "../../utils/debug-logger.js";

// Helper function to check if user is the owner of a resource
// This handles both string and numeric ID comparisons in a more robust way
const isUserResourceOwner = (
  recordOwnerId: unknown,
  userId: unknown,
): boolean => {
  logger.info(
    `Comparing ownership IDs: recordOwnerId=${recordOwnerId} (${typeof recordOwnerId}), userId=${userId} (${typeof userId})`,
  );

  // Special case: if either is undefined or null, they can't match
  if (
    recordOwnerId === undefined ||
    recordOwnerId === null ||
    userId === undefined ||
    userId === null
  ) {
    logger.info("Ownership check failed: one of the IDs is null or undefined");
    return false;
  }

  // Convert both to strings and compare - most reliable method
  const recordOwnerIdStr = String(recordOwnerId).trim();
  const userIdStr = String(userId).trim();

  // Direct string comparison
  if (recordOwnerIdStr === userIdStr) {
    logger.info("Ownership match by direct string comparison");
    return true;
  }

  // Try numeric comparison if both can be parsed as numbers
  const recordOwnerIdNum = parseFloat(recordOwnerIdStr);
  const userIdNum = parseFloat(userIdStr);

  if (
    !isNaN(recordOwnerIdNum) &&
    !isNaN(userIdNum) &&
    recordOwnerIdNum === userIdNum
  ) {
    logger.info("Ownership match by numeric comparison");
    return true;
  }

  // No match
  logger.info(
    "Ownership check failed: IDs don't match by string or numeric comparison",
  );
  return false;
};

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

    // Check ownership if needed
    const ownerCheck = (
      req as { ownerCheckOnly?: boolean; strictOwnerCheck?: boolean }
    ).ownerCheckOnly;
    const strictOwnerCheck = (req as { strictOwnerCheck?: boolean })
      .strictOwnerCheck;

    if (ownerCheck) {
      const resourceConfig = (req as RequestWithResource).resource;
      const user = (req as unknown as RequestWithUser).user;

      if (resourceConfig?.ownedBy && user) {
        const ownerField = resourceConfig.ownedBy;
        const record = result.value;

        logger.info(
          `Checking ownership: ${ownerField}=${record[ownerField]}, user=${user.username}, userId=${user.id}, strictCheck=${!!strictOwnerCheck}`,
        );

        // Check direct ownership - record's owner field equals user.id
        const isOwner = isUserResourceOwner(record[ownerField], user.id);

        if (!isOwner) {
          logger.info("Ownership check failed - forbidden");
          return res.status(403).json({
            status: 403,
            message: "Insufficient permissions - not the owner",
            code: "FORBIDDEN_NOT_OWNER",
          });
        }

        logger.info("Ownership check passed - access granted");
      }
    } else if (strictOwnerCheck) {
      // If this is a strict owner check but the ownerCheck flag wasn't set,
      // this means we didn't even check ownership - reject access
      logger.info(
        "STRICT owner check failed - no ownership check was performed",
      );
      return res.status(403).json({
        status: 403,
        message: "Insufficient permissions - strict owner check failed",
        code: "FORBIDDEN_STRICT_OWNER",
      });
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

    // Get the resource configuration from the request (added by authorization middleware)
    const resourceConfig = (req as RequestWithResource).resource;

    // Handle automatic owner assignment if this resource has an ownership field
    // and the user is authenticated
    let dataToCreate = { ...req.body };

    logger.info(
      `Creating resource '${resourceName}' with payload: ${JSON.stringify(dataToCreate)}`,
    );

    // Handle ownership check for creation
    // For resource creation, there's no existing resource to check ownership against
    // Instead, we automatically set ownership if the resource has an ownership field
    const user = (req as unknown as RequestWithUser).user;

    if (resourceConfig?.ownedBy && user) {
      const ownerField = resourceConfig.ownedBy;
      const username = user?.username;
      const userId = user?.id;

      logger.info(
        `Creating ${resourceName} with automatic owner assignment: field=${ownerField}, username=${username}, userId=${userId}`,
      );

      // For automatic ownership assignment, ALWAYS set the field regardless of what
      // might be provided in the payload. We need to enforce ownership.
      logger.info(
        `Setting ownership field ${ownerField} to user ID ${userId} for new ${resourceName}`,
      );

      // Even if userId is in the request body, we need to override it
      if (userId) {
        logger.info(`Using userId from token: ${userId}`);
        dataToCreate[ownerField] = userId;
      }
      // If no userId in token but we have username, look it up from the database
      else if (username) {
        // Get user resource configuration from the request (added by authorization middleware)
        const apiConfig = (req as unknown as RequestWithApiConfig).apiConfig;
        const userResourceName =
          apiConfig?.options?.auth?.userResource || "users";
        const usernameField =
          apiConfig?.options?.auth?.usernameField || "username";

        logger.info(
          `Looking up user ID: resource=${userResourceName}, field=${usernameField}, value=${username}`,
        );

        // Find the user's ID
        const usersResourceResult = db.getResource(userResourceName);
        if (usersResourceResult.ok) {
          const usersResource = usersResourceResult.value;
          // Create query using the configured username field
          const query: Record<string, string> = {};
          query[usernameField] = username;

          const userResult = await usersResource.findOne(query);

          if (userResult.ok && userResult.value) {
            const foundUserId = userResult.value.id;
            logger.info(`Found user ID for ${username}: ${foundUserId}`);

            // Set the owner field regardless of what was provided in the request
            dataToCreate[ownerField] = foundUserId;
          } else {
            logger.info(
              `User ${username} not found: ${userResult.ok ? "No user found" : userResult.error.message}`,
            );
          }
        } else {
          logger.info(
            `User resource ${userResourceName} not found: ${usersResourceResult.error?.message}`,
          );
        }
      } else {
        logger.info(`No username or userId available for owner assignment`);
      }
    } else {
      logger.info(
        `No owner assignment: resourceHasOwnerField=${!!resourceConfig?.ownedBy}, userAvailable=${!!user}`,
      );
    }

    // Create the record
    const result = await resource.create(dataToCreate);
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

    // Get the record first to check ownership
    const getResult = await resource.findById(resourceId);
    if (!getResult.ok || !getResult.value) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: `${resourceName} with id ${id} not found`,
        code: "RECORD_NOT_FOUND",
      };
      return res.status(404).json(errorResponse);
    }

    // Check ownership if needed (for update operations)
    const ownerCheck = (
      req as { ownerCheckOnly?: boolean; strictOwnerCheck?: boolean }
    ).ownerCheckOnly;
    const strictOwnerCheck = (req as { strictOwnerCheck?: boolean })
      .strictOwnerCheck;

    if (ownerCheck) {
      const resourceConfig = (req as RequestWithResource).resource;
      const user = (req as unknown as RequestWithUser).user;

      if (resourceConfig?.ownedBy && user) {
        const ownerField = resourceConfig.ownedBy;
        const record = getResult.value;

        logger.info(
          `Checking ownership for update: ${ownerField}=${record[ownerField]}, user=${user.username}, userId=${user.id}, strictCheck=${!!strictOwnerCheck}`,
        );

        // Check direct ownership - record's owner field equals user.id
        const isOwner = isUserResourceOwner(record[ownerField], user.id);
        logger.info(
          `Ownership check result: isOwner=${isOwner}, recordOwnerId=${record[ownerField]}, userId=${user.id}`,
        );

        if (!isOwner) {
          logger.info("Ownership check failed for update - forbidden");
          return res.status(403).json({
            status: 403,
            message: "Insufficient permissions - not the owner",
            code: "FORBIDDEN_NOT_OWNER",
          });
        }

        logger.info("Ownership check passed for update - access granted");
      }
    } else if (strictOwnerCheck) {
      // If this is a strict owner check but the ownerCheck flag wasn't set,
      // this means we didn't even check ownership - reject access
      logger.info(
        "STRICT owner check failed - no ownership check was performed",
      );
      return res.status(403).json({
        status: 403,
        message: "Insufficient permissions - strict owner check failed",
        code: "FORBIDDEN_STRICT_OWNER",
      });
    }

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

    // Get the record first to check ownership
    const getResult = await resource.findById(resourceId);
    if (!getResult.ok || !getResult.value) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: `${resourceName} with id ${id} not found`,
        code: "RECORD_NOT_FOUND",
      };
      return res.status(404).json(errorResponse);
    }

    // Check ownership if needed (for update operations)
    const ownerCheck = (
      req as { ownerCheckOnly?: boolean; strictOwnerCheck?: boolean }
    ).ownerCheckOnly;
    const strictOwnerCheck = (req as { strictOwnerCheck?: boolean })
      .strictOwnerCheck;

    if (ownerCheck) {
      const resourceConfig = (req as RequestWithResource).resource;
      const user = (req as unknown as RequestWithUser).user;

      if (resourceConfig?.ownedBy && user) {
        const ownerField = resourceConfig.ownedBy;
        const record = getResult.value;

        logger.info(
          `Checking ownership for patch: ${ownerField}=${record[ownerField]}, user=${user.username}, userId=${user.id}, strictCheck=${!!strictOwnerCheck}`,
        );

        // Check direct ownership - record's owner field equals user.id
        const isOwner = isUserResourceOwner(record[ownerField], user.id);
        logger.info(
          `Ownership check result: isOwner=${isOwner}, recordOwnerId=${record[ownerField]}, userId=${user.id}`,
        );

        if (!isOwner) {
          logger.info("Ownership check failed for patch - forbidden");
          return res.status(403).json({
            status: 403,
            message: "Insufficient permissions - not the owner",
            code: "FORBIDDEN_NOT_OWNER",
          });
        }

        logger.info("Ownership check passed for patch - access granted");
      }
    } else if (strictOwnerCheck) {
      // If this is a strict owner check but the ownerCheck flag wasn't set,
      // this means we didn't even check ownership - reject access
      logger.info(
        "STRICT owner check failed - no ownership check was performed",
      );
      return res.status(403).json({
        status: 403,
        message: "Insufficient permissions - strict owner check failed",
        code: "FORBIDDEN_STRICT_OWNER",
      });
    }

    // Additional access log for debugging
    logger.info(`PATCH operation - resourceId=${resourceId}, access granted`);

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

    // Get the record first to check ownership
    const getResult = await resource.findById(resourceId);
    if (!getResult.ok || !getResult.value) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: `${resourceName} with id ${id} not found`,
        code: "RECORD_NOT_FOUND",
      };
      return res.status(404).json(errorResponse);
    }

    // Check ownership if needed (for delete operations)
    const ownerCheck = (
      req as { ownerCheckOnly?: boolean; strictOwnerCheck?: boolean }
    ).ownerCheckOnly;
    const strictOwnerCheck = (req as { strictOwnerCheck?: boolean })
      .strictOwnerCheck;

    if (ownerCheck) {
      const resourceConfig = (req as RequestWithResource).resource;
      const user = (req as unknown as RequestWithUser).user;

      if (resourceConfig?.ownedBy && user) {
        const ownerField = resourceConfig.ownedBy;
        const record = getResult.value;

        logger.info(
          `Checking ownership for delete: ${ownerField}=${record[ownerField]}, user=${user.username}, userId=${user.id}, strictCheck=${!!strictOwnerCheck}`,
        );

        // Check direct ownership - record's owner field equals user.id
        const isOwner = isUserResourceOwner(record[ownerField], user.id);

        if (!isOwner) {
          logger.info("Ownership check failed for delete - forbidden");
          return res.status(403).json({
            status: 403,
            message: "Insufficient permissions - not the owner",
            code: "FORBIDDEN_NOT_OWNER",
          });
        }

        logger.info("Ownership check passed for delete - access granted");
      }
    } else if (strictOwnerCheck) {
      // If this is a strict owner check but the ownerCheck flag wasn't set,
      // this means we didn't even check ownership - reject access
      logger.info(
        "STRICT owner check failed - no ownership check was performed",
      );
      return res.status(403).json({
        status: 403,
        message: "Insufficient permissions - strict owner check failed",
        code: "FORBIDDEN_STRICT_OWNER",
      });
    }

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
