import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  processNowField,
  processUuidField,
  processUserIdField,
  processIncrementField,
  processHashField,
  processSpecialFields,
  processSpecialFieldsForUpdate,
  processHashFields,
  SpecialFieldMode,
} from "./special-fields.js";
import { DbRecord, ResourceField } from "../../../types/index.js";

// Mock UUID generation for testing
vi.mock("uuid", () => ({
  v4: () => "mocked-uuid-value",
}));

describe("Special Fields Processing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("processNowField", () => {
    it("should return the current date", () => {
      const result = processNowField();
      expect(result).toEqual(new Date("2025-01-01"));
    });
  });

  describe("processUuidField", () => {
    it("should return a UUID", () => {
      const result = processUuidField();
      expect(result).toBe("mocked-uuid-value");
    });
  });

  describe("processUserIdField", () => {
    it("should return the provided user ID", () => {
      expect(processUserIdField(123)).toBe(123);
      expect(processUserIdField("user-123")).toBe("user-123");
    });

    it("should return null when no user ID is provided", () => {
      expect(processUserIdField()).toBe(null);
    });
  });

  describe("processIncrementField", () => {
    it("should return 1 for empty collection", () => {
      const result = processIncrementField([], "id");
      expect(result).toBe(1);
    });

    it("should increment the max value", () => {
      const records = [
        { id: 1, count: 5 },
        { id: 2, count: 10 },
        { id: 3, count: 3 },
      ];

      expect(processIncrementField(records, "id")).toBe(4);
      expect(processIncrementField(records, "count")).toBe(11);
    });
  });

  describe("processHashField", () => {
    it("should hash the input value", () => {
      const result = processHashField("password");
      expect(result).toMatch(/^[a-f0-9]{64}$/); // SHA-256 is 64 chars hex
      expect(result).not.toBe("password");
    });

    it("should return empty string for empty input", () => {
      expect(processHashField("")).toBe("");
    });
  });

  describe("processSpecialFields", () => {
    const fields: ResourceField[] = [
      { name: "id", type: "number" },
      { name: "name", type: "string" },
      { name: "createdAt", type: "date", defaultValue: "$now" },
      { name: "userId", type: "number", defaultValue: "$userId" },
      { name: "orderId", type: "string", defaultValue: "$uuid" },
      { name: "counter", type: "number", defaultValue: "$increment" },
      { name: "updatedAt", type: "date", defaultValue: "$now" },
      { name: "password", type: "string", defaultValue: "$hash" },
      { name: "role", type: "string", defaultValue: "user" },
    ];

    it("should process all special fields for new records", () => {
      const data: DbRecord = {
        name: "Test Record",
        password: "securepassword",
      };

      const existingRecords = [
        { id: 1, counter: 5 },
        { id: 2, counter: 10 },
      ];

      const result = processSpecialFields(
        data,
        fields,
        existingRecords,
        SpecialFieldMode.INSERT,
        42,
      );

      expect(result).toEqual({
        name: "Test Record",
        password: "securepassword", // Password hash happens in separate step
        createdAt: new Date("2025-01-01"),
        userId: 42,
        orderId: "mocked-uuid-value",
        counter: 11,
        updatedAt: new Date("2025-01-01"),
        role: "user",
      });
    });

    it("should not override provided values by default", () => {
      const data: DbRecord = {
        name: "Test Record",
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
        userId: 24,
        orderId: "custom-id",
        counter: 42,
        role: "admin",
      };

      const result = processSpecialFields(data, fields);

      expect(result.createdAt).toEqual(new Date("2020-01-01"));
      expect(result.updatedAt).toEqual(new Date("2020-01-01"));
      expect(result.userId).toBe(24);
      expect(result.orderId).toBe("custom-id");
      expect(result.counter).toBe(42);
      expect(result.role).toBe("admin");
    });

    it("should force process fields in ALWAYS mode", () => {
      const data: DbRecord = {
        name: "Test Record",
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      const result = processSpecialFields(
        data,
        fields,
        [],
        SpecialFieldMode.ALWAYS,
      );

      // In ALWAYS mode, updatedAt should be updated regardless
      expect(result.createdAt).toEqual(new Date("2025-01-01"));
      expect(result.updatedAt).toEqual(new Date("2025-01-01"));
    });
  });

  describe("processSpecialFieldsForUpdate", () => {
    const fields: ResourceField[] = [
      { name: "id", type: "number" },
      { name: "name", type: "string" },
      { name: "createdAt", type: "date", defaultValue: "$now" },
      { name: "updatedAt", type: "date", defaultValue: "$now" },
    ];

    it("should only update special fields meant for updates", () => {
      const data: DbRecord = {
        name: "Updated Record",
      };

      const result = processSpecialFieldsForUpdate(data, fields);

      // Should not add createdAt on updates
      expect(result.createdAt).toBeUndefined();

      // Should add updatedAt
      expect(result.updatedAt).toEqual(new Date("2025-01-01"));
      expect(result.name).toBe("Updated Record");
    });
  });

  describe("processHashFields", () => {
    const fields: ResourceField[] = [
      { name: "password", type: "string", defaultValue: "$hash" },
      { name: "regularField", type: "string" },
      { name: "confirmPassword", type: "string" },
    ];

    it("should hash password fields", () => {
      const data: DbRecord = {
        password: "mypassword",
        regularField: "value",
        confirmPassword: "mypassword",
      };

      const result = processHashFields(data, fields);

      // Field with $hash defaultValue should be hashed
      expect(result.password).not.toBe("mypassword");
      expect(result.password).toMatch(/^[a-f0-9]{64}$/);

      // Regular field should be unchanged
      expect(result.regularField).toBe("value");

      // Field with "password" in name should be hashed
      expect(result.confirmPassword).not.toBe("mypassword");
      expect(result.confirmPassword).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should not hash already hashed values", () => {
      const hashedValue = "a".repeat(64); // Looks like a hash
      const data: DbRecord = {
        password: hashedValue,
        confirmPassword: hashedValue,
      };

      const result = processHashFields(data, fields);

      // Already hashed values should not be re-hashed
      expect(result.password).toBe(hashedValue);
      expect(result.confirmPassword).toBe(hashedValue);
    });
  });
});
