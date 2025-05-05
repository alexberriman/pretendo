import { describe, it, expect } from "vitest";
import { generateFieldSchema } from "./field-schema.js";
import { ResourceField } from "../../../types/index.js";

describe("field-schema", () => {
  describe("generateFieldSchema", () => {
    it("should generate a basic schema for a string field", () => {
      const field: ResourceField = {
        name: "username",
        type: "string",
      };

      const result = generateFieldSchema(field);

      expect(result).toEqual({
        type: "string",
      });
    });

    it("should include description when provided", () => {
      const field: ResourceField = {
        name: "username",
        type: "string",
        description: "The user's username",
      };

      const result = generateFieldSchema(field);

      expect(result).toEqual({
        type: "string",
        description: "The user's username",
      });
    });

    it("should include format when type mapping provides one", () => {
      const field: ResourceField = {
        name: "createdAt",
        type: "date",
      };

      const result = generateFieldSchema(field);

      expect(result).toEqual({
        type: "string",
        format: "date-time",
      });
    });

    it("should include enum values when provided", () => {
      const field: ResourceField = {
        name: "status",
        type: "string",
        enum: ["active", "inactive", "pending"],
      };

      const result = generateFieldSchema(field);

      expect(result).toEqual({
        type: "string",
        enum: ["active", "inactive", "pending"],
      });
    });

    it("should include pattern when provided", () => {
      const field: ResourceField = {
        name: "zipCode",
        type: "string",
        pattern: "^\\d{5}(-\\d{4})?$",
      };

      const result = generateFieldSchema(field);

      expect(result).toEqual({
        type: "string",
        pattern: "^\\d{5}(-\\d{4})?$",
      });
    });

    it("should include string validation constraints", () => {
      const field: ResourceField = {
        name: "username",
        type: "string",
        minLength: 3,
        maxLength: 50,
      };

      const result = generateFieldSchema(field);

      expect(result).toEqual({
        type: "string",
        minLength: 3,
        maxLength: 50,
      });
    });

    it("should include number validation constraints", () => {
      const field: ResourceField = {
        name: "age",
        type: "number",
        min: 18,
        max: 120,
      };

      const result = generateFieldSchema(field);

      expect(result).toEqual({
        type: "number",
        minimum: 18,
        maximum: 120,
      });
    });

    it("should include all provided constraints", () => {
      const field: ResourceField = {
        name: "email",
        type: "string",
        description: "User's email address",
        pattern: "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$",
        minLength: 5,
        maxLength: 100,
        required: true,
      };

      const result = generateFieldSchema(field);

      expect(result).toEqual({
        type: "string",
        description: "User's email address",
        pattern: "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$",
        minLength: 5,
        maxLength: 100,
      });
    });
  });
});
