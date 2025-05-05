import { describe, expect, it } from "vitest";
import { validateRecord } from "./index.js";
import { ResourceField } from "../../../types/config.js";

describe("validateRecord", () => {
  // Helper function to create fields for testing
  const createField = (
    overrides: Partial<ResourceField> = {},
  ): ResourceField => ({
    name: "testField",
    type: "string",
    ...overrides,
  });

  // Required field validation
  it("validates required fields during creation", () => {
    const fields = [createField({ name: "username", required: true })];

    // Missing required field
    const emptyRecord = {};
    const emptyResult = validateRecord(emptyRecord, fields, "users");
    expect(emptyResult.ok).toBe(false);
    expect(emptyResult.error?.[0].rule).toBe("required");

    // With required field
    const validRecord = { username: "john" };
    const validResult = validateRecord(validRecord, fields, "users");
    expect(validResult.ok).toBe(true);
  });

  // Required field validation during update
  it("does not validate required fields during update", () => {
    const fields = [createField({ name: "username", required: true })];

    // Missing required field, but this is an update
    const emptyRecord = {};
    const result = validateRecord(emptyRecord, fields, "users", [], true);

    // Should pass because required is only enforced during creation
    expect(result.ok).toBe(true);
  });

  // Enum validation
  it("validates enum values", () => {
    const fields = [
      createField({
        name: "role",
        enum: ["admin", "user", "editor"],
      }),
    ];

    // Invalid enum value
    const invalidRecord = { role: "guest" };
    const invalidResult = validateRecord(invalidRecord, fields, "users");
    expect(invalidResult.ok).toBe(false);
    expect(invalidResult.error?.[0].rule).toBe("enum");

    // Valid enum value
    const validRecord = { role: "admin" };
    const validResult = validateRecord(validRecord, fields, "users");
    expect(validResult.ok).toBe(true);
  });

  // Numeric constraints
  it("validates min and max for numeric fields", () => {
    const fields = [
      createField({
        name: "age",
        type: "number",
        min: 18,
        max: 65,
      }),
    ];

    // Too small
    const tooSmall = { age: 15 };
    const smallResult = validateRecord(tooSmall, fields, "users");
    expect(smallResult.ok).toBe(false);
    expect(smallResult.error?.[0].rule).toBe("min");

    // Too large
    const tooLarge = { age: 70 };
    const largeResult = validateRecord(tooLarge, fields, "users");
    expect(largeResult.ok).toBe(false);
    expect(largeResult.error?.[0].rule).toBe("max");

    // Just right
    const valid = { age: 30 };
    const validResult = validateRecord(valid, fields, "users");
    expect(validResult.ok).toBe(true);
  });

  // String length constraints
  it("validates minLength and maxLength for string fields", () => {
    const fields = [
      createField({
        name: "username",
        type: "string",
        minLength: 3,
        maxLength: 20,
      }),
    ];

    // Too short
    const tooShort = { username: "ab" };
    const shortResult = validateRecord(tooShort, fields, "users");
    expect(shortResult.ok).toBe(false);
    expect(shortResult.error?.[0].rule).toBe("minLength");

    // Too long
    const tooLong = { username: "abcdefghijklmnopqrstuvwxyz" };
    const longResult = validateRecord(tooLong, fields, "users");
    expect(longResult.ok).toBe(false);
    expect(longResult.error?.[0].rule).toBe("maxLength");

    // Just right
    const valid = { username: "johndoe" };
    const validResult = validateRecord(valid, fields, "users");
    expect(validResult.ok).toBe(true);
  });

  // Pattern validation
  it("validates pattern for string fields", () => {
    const fields = [
      createField({
        name: "email",
        type: "string",
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      }),
    ];

    // Invalid pattern
    const invalid = { email: "not-an-email" };
    const invalidResult = validateRecord(invalid, fields, "users");
    expect(invalidResult.ok).toBe(false);
    expect(invalidResult.error?.[0].rule).toBe("pattern");

    // Valid pattern
    const valid = { email: "john@example.com" };
    const validResult = validateRecord(valid, fields, "users");
    expect(validResult.ok).toBe(true);
  });

  // Unique validation
  it("validates unique fields", () => {
    const fields = [
      createField({
        name: "username",
        type: "string",
        unique: true,
      }),
    ];

    const existingRecords = [
      { id: 1, username: "alice" },
      { id: 2, username: "bob" },
    ];

    // Duplicate value
    const duplicate = { username: "alice" };
    const duplicateResult = validateRecord(
      duplicate,
      fields,
      "users",
      existingRecords,
    );
    expect(duplicateResult.ok).toBe(false);
    expect(duplicateResult.error?.[0].rule).toBe("unique");

    // Unique value
    const unique = { username: "charlie" };
    const uniqueResult = validateRecord(
      unique,
      fields,
      "users",
      existingRecords,
    );
    expect(uniqueResult.ok).toBe(true);
  });

  // Unique validation - updating existing record
  it("allows unique field validation for the record being updated", () => {
    const fields = [
      createField({
        name: "username",
        type: "string",
        unique: true,
      }),
    ];

    const existingRecords = [
      { id: 1, username: "alice" },
      { id: 2, username: "bob" },
    ];

    // Update record 1, keeping same username
    const update = { id: 1, username: "alice" };
    const updateResult = validateRecord(
      update,
      fields,
      "users",
      existingRecords,
      true,
    );
    expect(updateResult.ok).toBe(true);

    // Update record 1, using a username that's already taken
    const conflictUpdate = { id: 1, username: "bob" };
    const conflictResult = validateRecord(
      conflictUpdate,
      fields,
      "users",
      existingRecords,
      true,
    );
    expect(conflictResult.ok).toBe(false);
    expect(conflictResult.error?.[0].rule).toBe("unique");
  });

  // Multiple validation errors
  it("returns all validation errors", () => {
    const fields = [
      createField({
        name: "username",
        type: "string",
        required: true,
        minLength: 3,
      }),
      createField({
        name: "age",
        type: "number",
        min: 18,
      }),
    ];

    const record = { username: "a", age: 15 };
    const result = validateRecord(record, fields, "users");

    expect(result.ok).toBe(false);
    expect(result.error?.length).toBe(2);
    expect(result.error?.[0].field).toBe("username");
    expect(result.error?.[0].rule).toBe("minLength");
    expect(result.error?.[1].field).toBe("age");
    expect(result.error?.[1].rule).toBe("min");
  });
});
