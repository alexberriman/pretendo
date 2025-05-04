import { describe, it, expect } from "vitest";
import { getData } from "./get-data.js";
import { DbRecord } from "../../../types/index.js";

describe("getData", () => {
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

  it("should return a deep copy of all data when no collection is specified", () => {
    const result = getData(storeData);

    // Should return the entire data store
    expect(result).toEqual(storeData);

    // Should be a deep copy
    expect(result).not.toBe(storeData);

    // Modifying the result should not affect the original
    if (typeof result === "object" && result !== null) {
      (result as Record<string, DbRecord[]>).users.push({
        id: 3,
        name: "Jack",
      });
      expect(storeData.users.length).toBe(2);
    }
  });

  it("should return a Result with the collection when a collection is specified", () => {
    const result = getData(storeData, "users");

    // Should return a Result
    expect(result).toHaveProperty("ok");

    if ("ok" in result && result.ok && "value" in result) {
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
    const result = getData(storeData, "nonExistentCollection");

    // Collection should be created in the original store
    expect(storeData).toHaveProperty("nonExistentCollection");
    expect(storeData.nonExistentCollection).toEqual([]);

    if ("ok" in result && result.ok && "value" in result) {
      // Should return an empty array
      expect(result.value).toEqual([]);

      // Should be a deep copy
      expect(result.value).not.toBe(storeData.nonExistentCollection);
    }
  });
});
