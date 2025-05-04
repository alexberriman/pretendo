import { PaginationMeta } from "../../types/index.js";

/**
 * Creates pagination metadata including links for pagination navigation
 */
export const createPaginationMeta = (
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
