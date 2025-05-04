import { describe, it, expect } from "vitest";
import { applyPagination } from "./apply-pagination.js";
import { DbRecord } from "../../../types/index.js";

describe("applyPagination", () => {
  // Create 25 test records for pagination testing
  const generateTestRecords = (count: number): DbRecord[] => {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      name: `Record ${index + 1}`,
    }));
  };

  const records = generateTestRecords(25);

  it("should return the first page of records with default parameters", () => {
    // Default is page 1 and perPage 10
    const result = applyPagination(records);

    expect(result).toHaveLength(10);
    expect(result[0].id).toBe(1);
    expect(result[9].id).toBe(10);
  });

  it("should return a specific page of records", () => {
    // Second page with 10 records per page
    const result = applyPagination(records, 2, 10);

    expect(result).toHaveLength(10);
    expect(result[0].id).toBe(11);
    expect(result[9].id).toBe(20);
  });

  it("should handle custom page sizes", () => {
    // First page with 5 records per page
    const result = applyPagination(records, 1, 5);

    expect(result).toHaveLength(5);
    expect(result[0].id).toBe(1);
    expect(result[4].id).toBe(5);
  });

  it("should return partial page when not enough records", () => {
    // Third page with 10 records per page (only 5 records remain)
    const result = applyPagination(records, 3, 10);

    expect(result).toHaveLength(5);
    expect(result[0].id).toBe(21);
    expect(result[4].id).toBe(25);
  });

  it("should return empty array for pages beyond available records", () => {
    // Fourth page with 10 records per page (no records remain)
    const result = applyPagination(records, 4, 10);

    expect(result).toHaveLength(0);
  });

  it("should handle edge case of page 0 by treating it as page 1", () => {
    // Page 0 should be treated as page 1
    const result = applyPagination(records, 0, 10);

    expect(result).toHaveLength(10);
    expect(result[0].id).toBe(1);
  });

  it("should handle negative page numbers by treating them as page 1", () => {
    // Negative page should be treated as page 1
    const result = applyPagination(records, -1, 10);

    expect(result).toHaveLength(10);
    expect(result[0].id).toBe(1);
  });

  it("should handle perPage = 0 by returning empty array", () => {
    const result = applyPagination(records, 1, 0);
    expect(result).toHaveLength(0);
  });

  it("should not modify the original array", () => {
    const originalRecords = [...records];

    applyPagination(records, 2, 5);

    // Original array should remain unmodified
    expect(records).toEqual(originalRecords);
  });
});
