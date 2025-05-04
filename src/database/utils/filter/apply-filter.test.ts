import { describe, it, expect } from "vitest";
import { applyFilter } from "./apply-filter.js";
import { DbRecord, QueryFilter } from "../../../types/index.js";

describe("applyFilter", () => {
  // Test record
  const record: DbRecord = {
    id: 1,
    name: "Test Product",
    price: 99.99,
    category: "Electronics",
    tags: ["tech", "gadget"],
    isActive: true,
    rating: 4.5,
  };

  it("should match exact equality", () => {
    const filter: QueryFilter = {
      field: "name",
      operator: "eq",
      value: "Test Product",
    };
    expect(applyFilter(record, filter)).toBe(true);

    const nonMatchingFilter: QueryFilter = {
      field: "name",
      operator: "eq",
      value: "Different Product",
    };
    expect(applyFilter(record, nonMatchingFilter)).toBe(false);
  });

  it("should match inequality", () => {
    const filter: QueryFilter = {
      field: "name",
      operator: "ne",
      value: "Different Product",
    };
    expect(applyFilter(record, filter)).toBe(true);

    const nonMatchingFilter: QueryFilter = {
      field: "name",
      operator: "ne",
      value: "Test Product",
    };
    expect(applyFilter(record, nonMatchingFilter)).toBe(false);
  });

  it("should handle greater than comparisons", () => {
    const filter: QueryFilter = {
      field: "price",
      operator: "gt",
      value: 50,
    };
    expect(applyFilter(record, filter)).toBe(true);

    const nonMatchingFilter: QueryFilter = {
      field: "price",
      operator: "gt",
      value: 100,
    };
    expect(applyFilter(record, nonMatchingFilter)).toBe(false);
  });

  it("should handle greater than or equal comparisons", () => {
    const filter: QueryFilter = {
      field: "price",
      operator: "gte",
      value: 99.99,
    };
    expect(applyFilter(record, filter)).toBe(true);

    const nonMatchingFilter: QueryFilter = {
      field: "price",
      operator: "gte",
      value: 100,
    };
    expect(applyFilter(record, nonMatchingFilter)).toBe(false);
  });

  it("should handle less than comparisons", () => {
    const filter: QueryFilter = {
      field: "price",
      operator: "lt",
      value: 100,
    };
    expect(applyFilter(record, filter)).toBe(true);

    const nonMatchingFilter: QueryFilter = {
      field: "price",
      operator: "lt",
      value: 50,
    };
    expect(applyFilter(record, nonMatchingFilter)).toBe(false);
  });

  it("should handle less than or equal comparisons", () => {
    const filter: QueryFilter = {
      field: "price",
      operator: "lte",
      value: 99.99,
    };
    expect(applyFilter(record, filter)).toBe(true);

    const nonMatchingFilter: QueryFilter = {
      field: "price",
      operator: "lte",
      value: 50,
    };
    expect(applyFilter(record, nonMatchingFilter)).toBe(false);
  });

  it('should handle "in" operator', () => {
    const filter: QueryFilter = {
      field: "category",
      operator: "in",
      value: ["Electronics", "Computers"],
    };
    expect(applyFilter(record, filter)).toBe(true);

    const nonMatchingFilter: QueryFilter = {
      field: "category",
      operator: "in",
      value: ["Clothing", "Food"],
    };
    expect(applyFilter(record, nonMatchingFilter)).toBe(false);
  });

  it('should handle "nin" operator', () => {
    const filter: QueryFilter = {
      field: "category",
      operator: "nin",
      value: ["Clothing", "Food"],
    };
    expect(applyFilter(record, filter)).toBe(true);

    const nonMatchingFilter: QueryFilter = {
      field: "category",
      operator: "nin",
      value: ["Electronics", "Computers"],
    };
    expect(applyFilter(record, nonMatchingFilter)).toBe(false);
  });

  it('should handle "contains" operator', () => {
    const filter: QueryFilter = {
      field: "name",
      operator: "contains",
      value: "Product",
    };
    expect(applyFilter(record, filter)).toBe(true);

    const nonMatchingFilter: QueryFilter = {
      field: "name",
      operator: "contains",
      value: "Unknown",
    };
    expect(applyFilter(record, nonMatchingFilter)).toBe(false);
  });

  it('should handle "startsWith" operator', () => {
    const filter: QueryFilter = {
      field: "name",
      operator: "startsWith",
      value: "Test",
    };
    expect(applyFilter(record, filter)).toBe(true);

    const nonMatchingFilter: QueryFilter = {
      field: "name",
      operator: "startsWith",
      value: "Product",
    };
    expect(applyFilter(record, nonMatchingFilter)).toBe(false);
  });

  it('should handle "endsWith" operator', () => {
    const filter: QueryFilter = {
      field: "name",
      operator: "endsWith",
      value: "Product",
    };
    expect(applyFilter(record, filter)).toBe(true);

    const nonMatchingFilter: QueryFilter = {
      field: "name",
      operator: "endsWith",
      value: "Test",
    };
    expect(applyFilter(record, nonMatchingFilter)).toBe(false);
  });

  it("should handle case insensitive comparisons", () => {
    const filter: QueryFilter = {
      field: "name",
      operator: "eq",
      value: "test product",
      caseSensitive: false,
    };
    expect(applyFilter(record, filter)).toBe(true);

    const caseSensitiveFilter: QueryFilter = {
      field: "name",
      operator: "eq",
      value: "test product",
      caseSensitive: true,
    };
    expect(applyFilter(record, caseSensitiveFilter)).toBe(false);
  });

  it("should handle missing fields", () => {
    const filter: QueryFilter = {
      field: "nonExistentField",
      operator: "eq",
      value: "anything",
    };
    expect(applyFilter(record, filter)).toBe(false);
  });

  it("should handle null values", () => {
    const recordWithNull: DbRecord = {
      ...record,
      description: null,
    };

    const filter: QueryFilter = {
      field: "description",
      operator: "eq",
      value: null,
    };

    // null !== null in our implementation
    expect(applyFilter(recordWithNull, filter)).toBe(false);

    const neFilter: QueryFilter = {
      field: "description",
      operator: "ne",
      value: "anything",
    };
    expect(applyFilter(recordWithNull, neFilter)).toBe(true);
  });
});
