import { describe, it, expect, vi } from "vitest";
import {
  applyPaginationDefaults,
  createCountOptions,
  setPaginationHeaders,
} from "./pagination-utils.js";

// Mock the createPaginationMeta and getBaseUrl functions
vi.mock("../../utils/index.js", () => {
  return {
    createPaginationMeta: vi.fn(() => ({
      page: 2,
      perPage: 10,
      totalPages: 3,
      totalCount: 25,
      links: {
        first: "/api/items?page=1",
        prev: "/api/items?page=1",
        next: "/api/items?page=3",
        last: "/api/items?page=3",
      },
    })),
    getBaseUrl: vi.fn(() => "/api/items"),
  };
});

describe("Pagination Utilities", () => {
  describe("applyPaginationDefaults", () => {
    it("should apply default values when not provided", () => {
      const queryOptions = {};
      const defaultPageSize = 10;
      const maxPageSize = 50;

      applyPaginationDefaults(queryOptions, defaultPageSize, maxPageSize);

      expect(queryOptions.page).toBe(1);
      expect(queryOptions.perPage).toBe(10);
    });

    it("should maintain existing values when provided", () => {
      const queryOptions = { page: 2, perPage: 20 };
      const defaultPageSize = 10;
      const maxPageSize = 50;

      applyPaginationDefaults(queryOptions, defaultPageSize, maxPageSize);

      expect(queryOptions.page).toBe(2);
      expect(queryOptions.perPage).toBe(20);
    });

    it("should enforce max page size", () => {
      const queryOptions = { page: 1, perPage: 100 };
      const defaultPageSize = 10;
      const maxPageSize = 50;

      applyPaginationDefaults(queryOptions, defaultPageSize, maxPageSize);

      expect(queryOptions.page).toBe(1);
      expect(queryOptions.perPage).toBe(50);
    });
  });

  describe("createCountOptions", () => {
    it("should create a copy of options without page and perPage", () => {
      const queryOptions = {
        page: 2,
        perPage: 10,
        filter: { name: "test" },
        sort: "name:asc",
      };

      const countOptions = createCountOptions(queryOptions);

      expect(countOptions.page).toBeUndefined();
      expect(countOptions.perPage).toBeUndefined();
      expect(countOptions.filter).toEqual({ name: "test" });
      expect(countOptions.sort).toBe("name:asc");

      // Verify original options are unchanged
      expect(queryOptions.page).toBe(2);
      expect(queryOptions.perPage).toBe(10);
    });
  });

  describe("setPaginationHeaders", () => {
    it("should set Link and X-Total-Count headers", () => {
      const req = {};
      const res = {
        setHeader: vi.fn(),
      };
      const page = 2;
      const perPage = 10;
      const totalCount = 25;

      const pagination = setPaginationHeaders(
        req,
        res,
        page,
        perPage,
        totalCount,
      );

      // Verify Link header
      expect(res.setHeader).toHaveBeenCalledWith(
        "Link",
        expect.stringContaining('</api/items?page=1>; rel="first"'),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        "Link",
        expect.stringContaining('</api/items?page=1>; rel="prev"'),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        "Link",
        expect.stringContaining('</api/items?page=3>; rel="next"'),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        "Link",
        expect.stringContaining('</api/items?page=3>; rel="last"'),
      );

      // Verify X-Total-Count header
      expect(res.setHeader).toHaveBeenCalledWith("X-Total-Count", "25");

      // Verify pagination object
      expect(pagination).toEqual({
        page: 2,
        perPage: 10,
        totalPages: 3,
        totalCount: 25,
        links: {
          first: "/api/items?page=1",
          prev: "/api/items?page=1",
          next: "/api/items?page=3",
          last: "/api/items?page=3",
        },
      });
    });
  });
});
