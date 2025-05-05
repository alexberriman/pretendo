import { describe, it, expect } from "vitest";
import { selectFields } from "./select-fields.js";
import { DbRecord } from "../../../types/index.js";

describe("selectFields", () => {
  // Test records
  const records: DbRecord[] = [
    {
      id: 1,
      name: "Product 1",
      description: "Description for product 1",
      price: 19.99,
      category: "Electronics",
      tags: ["tech", "gadget"],
      inStock: true,
    },
    {
      id: 2,
      name: "Product 2",
      description: "Description for product 2",
      price: 29.99,
      category: "Clothing",
      inStock: false,
      // no tags field
    },
  ];

  // Single record for testing
  const record: DbRecord = {
    id: 3,
    name: "Product 3",
    description: "Description for product 3",
    price: 39.99,
    category: "Books",
    tags: ["reading", "education"],
    inStock: true,
  };

  it("should return all records unchanged when no fields are specified", () => {
    expect(selectFields(records)).toEqual(records);
    expect(selectFields(records, [])).toEqual(records);
    expect(selectFields(record)).toEqual(record);
    expect(selectFields(record, [])).toEqual(record);
  });

  it("should select only specified fields for all records", () => {
    const fields = ["id", "name", "price"];
    const result = selectFields(records, fields);

    expect(result).toHaveLength(2);

    // Check first record
    expect(Object.keys(result[0])).toHaveLength(3);
    expect(result[0].id).toBe(1);
    expect(result[0].name).toBe("Product 1");
    expect(result[0].price).toBe(19.99);
    expect(result[0].description).toBeUndefined();

    // Check second record
    expect(Object.keys(result[1])).toHaveLength(3);
    expect(result[1].id).toBe(2);
    expect(result[1].name).toBe("Product 2");
    expect(result[1].price).toBe(29.99);
  });

  it("should handle fields that only exist in some records", () => {
    const fields = ["id", "tags"];
    const result = selectFields(records, fields);

    // First record has tags
    expect(Object.keys(result[0])).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[0].tags).toEqual(["tech", "gadget"]);

    // Second record doesn't have tags
    expect(Object.keys(result[1])).toHaveLength(1);
    expect(result[1].id).toBe(2);
    expect(result[1].tags).toBeUndefined();
  });

  it("should handle fields that don't exist in any records", () => {
    const fields = ["id", "nonExistentField"];
    const result = selectFields(records, fields);

    // Both records should only have id
    expect(Object.keys(result[0])).toHaveLength(1);
    expect(result[0].id).toBe(1);

    expect(Object.keys(result[1])).toHaveLength(1);
    expect(result[1].id).toBe(2);
  });

  it("should handle complex data types in fields", () => {
    const fields = ["id", "tags"];
    const result = selectFields(records, fields);

    // Check that array is preserved
    expect(result[0].tags).toEqual(["tech", "gadget"]);

    // Check that it's not just a shallow copy
    expect(result[0].tags).not.toBe(records[0].tags);
  });

  it("should not modify the original records", () => {
    const originalRecords = JSON.parse(JSON.stringify(records));
    const originalRecord = JSON.parse(JSON.stringify(record));
    const fields = ["id", "name"];

    selectFields(records, fields);
    selectFields(record, fields);

    // Original records should remain unmodified
    expect(records).toEqual(originalRecords);
    expect(record).toEqual(originalRecord);
  });

  it("should select only specified fields for a single record", () => {
    const fields = ["id", "name", "price"];
    const result = selectFields(record, fields) as DbRecord;

    // Check that only specified fields are selected
    expect(Object.keys(result)).toHaveLength(3);
    expect(result.id).toBe(3);
    expect(result.name).toBe("Product 3");
    expect(result.price).toBe(39.99);
    expect(result.description).toBeUndefined();
  });
});
