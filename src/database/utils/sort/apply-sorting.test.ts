import { describe, it, expect } from "vitest";
import { applySorting } from "./apply-sorting.js";
import { DbRecord, QuerySort } from "../../../types/index.js";

describe("applySorting", () => {
  // Test records
  const records: DbRecord[] = [
    {
      id: 1,
      name: "Banana",
      price: 0.99,
      category: "Fruits",
      stock: 100,
    },
    {
      id: 2,
      name: "Apple",
      price: 1.49,
      category: "Fruits",
      stock: 75,
    },
    {
      id: 3,
      name: "Orange",
      price: 1.29,
      category: "Fruits",
      stock: null,
    },
    {
      id: 4,
      name: "Bread",
      price: 2.99,
      category: "Bakery",
      stock: 50,
    },
    {
      id: 5,
      name: "Milk",
      price: 3.49,
      category: "Dairy",
      // stock is undefined
    },
  ];

  it("should return original records when no sorts are provided", () => {
    expect(applySorting(records, [])).toEqual(records);
  });

  it("should sort records by a single field in ascending order", () => {
    const sorts: QuerySort[] = [{ field: "name", order: "asc" }];

    const result = applySorting(records, sorts);
    expect(result).toHaveLength(5);
    expect(result.map((r) => r.name)).toEqual([
      "Apple",
      "Banana",
      "Bread",
      "Milk",
      "Orange",
    ]);
  });

  it("should sort records by a single field in descending order", () => {
    const sorts: QuerySort[] = [{ field: "price", order: "desc" }];

    const result = applySorting(records, sorts);
    expect(result).toHaveLength(5);
    expect(result.map((r) => r.price)).toEqual([3.49, 2.99, 1.49, 1.29, 0.99]);
  });

  it("should handle multi-field sorting", () => {
    const sorts: QuerySort[] = [
      { field: "category", order: "asc" },
      { field: "price", order: "desc" },
    ];

    const result = applySorting(records, sorts);
    expect(result).toHaveLength(5);

    // First by category (alphabetically)
    expect(result[0].category).toBe("Bakery");
    expect(result[1].category).toBe("Dairy");

    // Fruits category should be sorted by price descending
    expect(result[2].category).toBe("Fruits");
    expect(result[2].price).toBe(1.49); // Apple is most expensive fruit
    expect(result[3].category).toBe("Fruits");
    expect(result[3].price).toBe(1.29); // Orange is middle price
    expect(result[4].category).toBe("Fruits");
    expect(result[4].price).toBe(0.99); // Banana is cheapest fruit
  });

  it("should handle null values by placing them first in ascending order", () => {
    const sorts: QuerySort[] = [{ field: "stock", order: "asc" }];

    const result = applySorting(records, sorts);

    // Null/undefined values should come first in ascending order, but the exact order
    // between null and undefined may vary by JavaScript engine
    const nullOrUndefinedNames = [result[0].name, result[1].name];
    expect(nullOrUndefinedNames).toContain("Orange"); // null stock
    expect(nullOrUndefinedNames).toContain("Milk"); // undefined stock

    // Then actual values in ascending order
    expect(result[2].stock).toBe(50);
    expect(result[3].stock).toBe(75);
    expect(result[4].stock).toBe(100);
  });

  it("should handle null values by placing them last in descending order", () => {
    const sorts: QuerySort[] = [{ field: "stock", order: "desc" }];

    const result = applySorting(records, sorts);

    // Actual values first in descending order
    expect(result[0].stock).toBe(100);
    expect(result[1].stock).toBe(75);
    expect(result[2].stock).toBe(50);

    // Null/undefined values should come last in descending order
    // but the exact order between null and undefined may vary by JavaScript engine
    const nullOrUndefinedNames = [result[3].name, result[4].name];
    expect(nullOrUndefinedNames).toContain("Milk"); // undefined stock
    expect(nullOrUndefinedNames).toContain("Orange"); // null stock
  });

  it("should not modify the original array", () => {
    const originalRecords = [...records];
    const sorts: QuerySort[] = [{ field: "name", order: "asc" }];

    applySorting(records, sorts);

    // Original array should remain unmodified
    expect(records).toEqual(originalRecords);
  });
});
