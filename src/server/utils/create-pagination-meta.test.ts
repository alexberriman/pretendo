import { describe, it, expect } from "vitest";
import { createPaginationMeta } from "./create-pagination-meta.js";

describe("createPaginationMeta", () => {
  it("should create correct pagination metadata with all links", () => {
    const baseUrl = "https://api.example.com/resources";
    const result = createPaginationMeta(2, 10, 35, baseUrl);

    expect(result).toEqual({
      currentPage: 2,
      perPage: 10,
      totalPages: 4,
      totalItems: 35,
      links: {
        first: "https://api.example.com/resources?page=1&perPage=10",
        prev: "https://api.example.com/resources?page=1&perPage=10",
        next: "https://api.example.com/resources?page=3&perPage=10",
        last: "https://api.example.com/resources?page=4&perPage=10",
      },
    });
  });

  it("should not include prev link on first page", () => {
    const baseUrl = "https://api.example.com/resources";
    const result = createPaginationMeta(1, 10, 35, baseUrl);

    expect(result.links).toHaveProperty("first");
    expect(result.links).toHaveProperty("next");
    expect(result.links).toHaveProperty("last");
    expect(result.links).not.toHaveProperty("prev");
  });

  it("should not include next link on last page", () => {
    const baseUrl = "https://api.example.com/resources";
    const result = createPaginationMeta(4, 10, 35, baseUrl);

    expect(result.links).toHaveProperty("first");
    expect(result.links).toHaveProperty("prev");
    expect(result.links).toHaveProperty("last");
    expect(result.links).not.toHaveProperty("next");
  });

  it("should calculate totalPages correctly", () => {
    // Exact division
    expect(
      createPaginationMeta(1, 10, 30, "https://example.com").totalPages,
    ).toBe(3);

    // With remainder
    expect(
      createPaginationMeta(1, 10, 35, "https://example.com").totalPages,
    ).toBe(4);

    // Single page
    expect(
      createPaginationMeta(1, 10, 5, "https://example.com").totalPages,
    ).toBe(1);

    // Zero items
    expect(
      createPaginationMeta(1, 10, 0, "https://example.com").totalPages,
    ).toBe(0);
  });

  it("should preserve query parameters in the base URL", () => {
    const baseUrl = "https://api.example.com/resources?filter=active&sort=name";
    const result = createPaginationMeta(2, 10, 35, baseUrl);

    // Check that original query params are preserved
    expect(result.links.first).toContain("filter=active");
    expect(result.links.first).toContain("sort=name");
    expect(result.links.first).toContain("page=1");
    expect(result.links.first).toContain("perPage=10");
  });

  it("should handle URLs with path parameters correctly", () => {
    const baseUrl = "https://api.example.com/users/123/posts";
    const result = createPaginationMeta(1, 10, 5, baseUrl);

    expect(result.links.first).toBe(
      "https://api.example.com/users/123/posts?page=1&perPage=10",
    );
  });
});
