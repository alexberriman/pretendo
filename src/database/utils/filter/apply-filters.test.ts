import { describe, it, expect } from "vitest";
import { applyFilters } from "./apply-filters.js";
import { DbRecord, QueryFilter } from "../../../types/index.js";

describe("applyFilters", () => {
  // Test records
  const records: DbRecord[] = [
    {
      id: 1,
      name: "Test Product 1",
      price: 99.99,
      category: "Electronics",
      isActive: true,
    },
    {
      id: 2,
      name: "Test Product 2",
      price: 49.99,
      category: "Clothing",
      isActive: true,
    },
    {
      id: 3,
      name: "Test Product 3",
      price: 149.99,
      category: "Electronics",
      isActive: false,
    },
    {
      id: 4,
      name: "Another Product",
      price: 199.99,
      category: "Furniture",
      isActive: true,
    },
  ];

  it("should return all records when no filters are provided", () => {
    expect(applyFilters(records)).toEqual(records);
    expect(applyFilters(records, [])).toEqual(records);
  });

  it("should filter records based on a single condition", () => {
    const filters: QueryFilter[] = [
      { field: "category", operator: "eq", value: "Electronics" },
    ];

    const result = applyFilters(records, filters);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(3);
  });

  it("should filter records based on multiple conditions (AND logic)", () => {
    const filters: QueryFilter[] = [
      { field: "category", operator: "eq", value: "Electronics" },
      { field: "isActive", operator: "eq", value: true },
    ];

    const result = applyFilters(records, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("should handle numeric comparisons", () => {
    const filters: QueryFilter[] = [
      { field: "price", operator: "gte", value: 100 },
    ];

    const result = applyFilters(records, filters);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(3);
    expect(result[1].id).toBe(4);
  });

  it("should handle string operations", () => {
    const filters: QueryFilter[] = [
      { field: "name", operator: "startsWith", value: "Test" },
    ];

    const result = applyFilters(records, filters);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it("should handle complex filtering scenarios", () => {
    const filters: QueryFilter[] = [
      { field: "name", operator: "startsWith", value: "Test" },
      { field: "price", operator: "lt", value: 100 },
      { field: "isActive", operator: "eq", value: true },
      { field: "category", operator: "eq", value: "Clothing" },
    ];

    const result = applyFilters(records, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("should return empty array when no records match the filters", () => {
    const filters: QueryFilter[] = [
      { field: "category", operator: "eq", value: "NonExistentCategory" },
    ];

    const result = applyFilters(records, filters);
    expect(result).toHaveLength(0);
  });
});
