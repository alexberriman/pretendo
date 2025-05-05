import { describe, it, expect } from "vitest";
import { generateResourceSchema } from "./resource-schema.js";
import { Resource } from "../../../types/index.js";

describe("resource-schema", () => {
  describe("generateResourceSchema", () => {
    it("should generate a schema for a resource with basic fields", () => {
      const resource: Resource = {
        name: "users",
        fields: [
          { name: "id", type: "number" },
          { name: "name", type: "string" },
          { name: "email", type: "string" },
        ],
      };

      const result = generateResourceSchema(resource);

      expect(result).toEqual({
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          email: { type: "string" },
        },
      });
    });

    it("should include required fields in the schema", () => {
      const resource: Resource = {
        name: "users",
        fields: [
          { name: "id", type: "number" },
          { name: "name", type: "string", required: true },
          { name: "email", type: "string", required: true },
        ],
      };

      const result = generateResourceSchema(resource);

      expect(result).toEqual({
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          email: { type: "string" },
        },
        required: ["name", "email"],
      });
    });

    it("should preserve field constraints in the schema", () => {
      const resource: Resource = {
        name: "users",
        fields: [
          { name: "id", type: "number" },
          {
            name: "username",
            type: "string",
            required: true,
            minLength: 3,
            maxLength: 50,
            pattern: "^[a-zA-Z0-9_]+$",
          },
          {
            name: "age",
            type: "number",
            min: 18,
            max: 120,
          },
          {
            name: "role",
            type: "string",
            enum: ["admin", "user", "guest"],
          },
        ],
      };

      const result = generateResourceSchema(resource);

      expect(result).toEqual({
        type: "object",
        properties: {
          id: { type: "number" },
          username: {
            type: "string",
            minLength: 3,
            maxLength: 50,
            pattern: "^[a-zA-Z0-9_]+$",
          },
          age: {
            type: "number",
            minimum: 18,
            maximum: 120,
          },
          role: {
            type: "string",
            enum: ["admin", "user", "guest"],
          },
        },
        required: ["username"],
      });
    });

    it("should omit required array if no fields are required", () => {
      const resource: Resource = {
        name: "products",
        fields: [
          { name: "id", type: "number" },
          { name: "name", type: "string" },
          { name: "price", type: "number" },
        ],
      };

      const result = generateResourceSchema(resource);

      expect(result).toEqual({
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          price: { type: "number" },
        },
      });
      expect(result).not.toHaveProperty("required");
    });

    it("should handle complex field types correctly", () => {
      const resource: Resource = {
        name: "products",
        fields: [
          { name: "id", type: "uuid" },
          { name: "metadata", type: "object" },
          { name: "tags", type: "array" },
          { name: "createdAt", type: "date" },
        ],
      };

      const result = generateResourceSchema(resource);

      expect(result).toEqual({
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          metadata: { type: "object", format: "json" },
          tags: { type: "array", format: "json" },
          createdAt: { type: "string", format: "date-time" },
        },
      });
    });
  });
});
