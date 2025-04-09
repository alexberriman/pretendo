import { describe, it, expect } from "vitest";
import { mergeConfig } from "./validator.js";
import { ApiConfig } from "../types/index.js";

describe("Config Validator", () => {
  describe("mergeConfig", () => {
    it("should return an error for empty resources", () => {
      const config: ApiConfig = {
        resources: [],
      };

      const result = mergeConfig(config);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("at least one resource");
      }
    });

    it("should merge options with defaults", () => {
      const config: ApiConfig = {
        resources: [
          {
            name: "users",
            fields: [
              { name: "id", type: "number" },
              { name: "name", type: "string" },
            ],
          },
        ],
        options: {
          port: 4000,
        },
      };

      const result = mergeConfig(config);
      expect(result.ok).toBe(true);

      if (result.ok) {
        expect(result.value.options?.port).toBe(4000);
        expect(result.value.options?.corsEnabled).toBe(true); // Default value
      }
    });

    it("should validate resource fields", () => {
      const config: ApiConfig = {
        resources: [
          {
            name: "users",
            fields: [], // Empty fields should fail
          },
        ],
      };

      const result = mergeConfig(config);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("at least one field");
      }
    });

    it("should ensure the primary key field exists", () => {
      const config: ApiConfig = {
        resources: [
          {
            name: "users",
            primaryKey: "customId",
            fields: [
              { name: "name", type: "string" },
              // Missing customId field
            ],
          },
        ],
      };

      const result = mergeConfig(config);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("primary key field");
      }
    });

    it("should validate relationships between resources", () => {
      const config: ApiConfig = {
        resources: [
          {
            name: "users",
            fields: [
              { name: "id", type: "number" },
              { name: "name", type: "string" },
            ],
            relationships: [
              {
                type: "hasMany",
                resource: "posts", // This resource doesn't exist yet
                foreignKey: "userId",
              },
            ],
          },
        ],
      };

      const result = mergeConfig(config);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("non-existent resource");
      }
    });

    it("should accept a valid config with resources and relationships", () => {
      const config: ApiConfig = {
        resources: [
          {
            name: "users",
            fields: [
              { name: "id", type: "number" },
              { name: "name", type: "string" },
            ],
          },
          {
            name: "posts",
            fields: [
              { name: "id", type: "number" },
              { name: "title", type: "string" },
              { name: "userId", type: "number" },
            ],
            relationships: [
              {
                type: "belongsTo",
                resource: "users",
                foreignKey: "userId",
              },
            ],
          },
        ],
      };

      const result = mergeConfig(config);
      expect(result.ok).toBe(true);

      if (result.ok) {
        expect(result.value.resources).toHaveLength(2);
        expect(result.value.resources[1].relationships).toHaveLength(1);
      }
    });
  });
});
