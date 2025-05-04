import { describe, it, expect } from "vitest";
import { getRecord } from "./get-record.js";
import { DbRecord } from "../../../types/index.js";

describe("getRecord", () => {
  // Test data
  const storeData: Record<string, DbRecord[]> = {
    users: [
      { id: 1, name: "John" },
      { id: 2, name: "Jane" },
      { userId: "user-3", name: "Bob" }, // Different primary key
    ],
    orders: [
      { orderId: "ord-1", total: 100 },
      { orderId: "ord-2", total: 200 },
    ],
  };

  it("should return a record by ID with the default primary key", () => {
    const result = getRecord(storeData, "users", 1);

    expect(result.ok).toBe(true);

    if (result.ok && result.value) {
      expect(result.value).toEqual({ id: 1, name: "John" });

      // Should be a deep copy
      expect(result.value).not.toBe(storeData.users[0]);

      // Modifying the result should not affect the original
      result.value.name = "Modified";
      expect(storeData.users[0].name).toBe("John");
    }
  });

  it("should return a record by ID with a custom primary key", () => {
    const result = getRecord(storeData, "orders", "ord-1", "orderId");

    expect(result.ok).toBe(true);

    if (result.ok && result.value) {
      expect(result.value).toEqual({ orderId: "ord-1", total: 100 });
    }
  });

  it("should return null for non-existent ID", () => {
    const result = getRecord(storeData, "users", 999);

    expect(result.ok).toBe(true);
    expect(result.value).toBeNull();
  });

  it("should return null for non-existent collection", () => {
    const result = getRecord(storeData, "nonExistentCollection", 1);

    expect(result.ok).toBe(true);
    expect(result.value).toBeNull();

    // Collection should be created in the original store
    expect(storeData).toHaveProperty("nonExistentCollection");
    expect(storeData.nonExistentCollection).toEqual([]);
  });

  it("should handle string and number IDs correctly", () => {
    // String ID that looks like a number
    const result1 = getRecord(storeData, "users", "1");

    // Should not match because '1' !== 1 (strict equality check)
    expect(result1.ok).toBe(true);
    expect(result1.value).toBeNull();

    // Specifically use a different primary key
    const result2 = getRecord(storeData, "users", "user-3", "userId");

    expect(result2.ok).toBe(true);

    if (result2.ok && result2.value) {
      expect(result2.value).toEqual({ userId: "user-3", name: "Bob" });
    }
  });
});
