import { describe, it, expect } from "vitest";
import { getCollection } from "./get-collection.js";
import { DbRecord } from "../../../types/index.js";

describe("getCollection", () => {
  // Test data
  const storeData: Record<string, DbRecord[]> = {
    users: [
      { id: 1, name: "John" },
      { id: 2, name: "Jane" },
    ],
    products: [
      { id: 1, name: "Product 1", price: 10 },
      { id: 2, name: "Product 2", price: 20 },
    ],
  };

  it("should return a Result with the specified collection", () => {
    const result = getCollection(storeData, "users");

    // Should be a successful Result
    expect(result.ok).toBe(true);

    if (result.ok) {
      // Should contain the users collection
      expect(result.value).toEqual(storeData.users);

      // Should be a deep copy
      expect(result.value).not.toBe(storeData.users);

      // Modifying the result should not affect the original
      result.value.push({ id: 3, name: "Jack" });
      expect(storeData.users.length).toBe(2);
    }
  });

  it("should auto-create a collection if it does not exist", () => {
    const result = getCollection(storeData, "nonExistentCollection");

    // Collection should be created in the original store
    expect(storeData).toHaveProperty("nonExistentCollection");
    expect(storeData.nonExistentCollection).toEqual([]);

    if (result.ok) {
      // Should return an empty array
      expect(result.value).toEqual([]);

      // Should be a deep copy
      expect(result.value).not.toBe(storeData.nonExistentCollection);
    }
  });

  it("should work with an empty store", () => {
    const emptyStore: Record<string, DbRecord[]> = {};
    const result = getCollection(emptyStore, "newCollection");

    // Collection should be created in the empty store
    expect(emptyStore).toHaveProperty("newCollection");
    expect(emptyStore.newCollection).toEqual([]);

    if (result.ok) {
      // Should return an empty array
      expect(result.value).toEqual([]);
    }
  });
});
