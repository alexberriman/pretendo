import { Request } from "express";
import { QueryOptions } from "../../../types/index.js";
import { createPaginationMeta, getBaseUrl } from "../../utils/index.js";

/**
 * Applies pagination defaults and limits to query options
 */
export const applyPaginationDefaults = (
  queryOptions: QueryOptions,
  defaultPageSize: number,
  maxPageSize: number,
): void => {
  // Apply pagination defaults
  queryOptions.page = queryOptions.page || 1;
  queryOptions.perPage = queryOptions.perPage || defaultPageSize;

  // Enforce max page size
  if (queryOptions.perPage > maxPageSize) {
    queryOptions.perPage = maxPageSize;
  }
};

/**
 * Creates a copy of query options without pagination parameters
 * Useful for total count queries
 */
export const createCountOptions = (
  queryOptions: QueryOptions,
): QueryOptions => {
  const countOptions: QueryOptions = { ...queryOptions };
  delete countOptions.page;
  delete countOptions.perPage;
  return countOptions;
};

/**
 * Sets pagination headers on the response
 */
export const setPaginationHeaders = (
  req: Request,
  res: {
    setHeader: (name: string, value: string) => void;
  },
  page: number,
  perPage: number,
  totalCount: number,
) => {
  // Create pagination metadata
  const pagination = createPaginationMeta(
    page,
    perPage,
    totalCount,
    getBaseUrl(req),
  );

  // Set Link header (RFC 5988) if links are available
  if (pagination.links) {
    const linkHeader = Object.entries(pagination.links)
      .map(([rel, url]) => `<${url}>; rel="${rel}"`)
      .join(", ");

    res.setHeader("Link", linkHeader);
  }

  res.setHeader("X-Total-Count", totalCount.toString());

  return pagination;
};
