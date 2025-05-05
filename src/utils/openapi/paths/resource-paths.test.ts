import { describe, it, expect } from "vitest";
import { generateResourcePaths } from "./resource-paths.js";
import { Resource } from "../../../types/index.js";

describe("resource-paths", () => {
  describe("generateResourcePaths", () => {
    it("should generate basic CRUD paths for a resource", () => {
      const resource: Resource = {
        name: "users",
        fields: [
          { name: "id", type: "number" },
          { name: "name", type: "string" },
          { name: "email", type: "string" },
        ],
      };

      const result = generateResourcePaths(resource);

      // Check collection endpoints
      expect(result).toHaveProperty("/users");
      expect(result["/users"]).toHaveProperty("get");
      expect(result["/users"]).toHaveProperty("post");

      // Check individual resource endpoints
      expect(result).toHaveProperty("/users/{id}");
      expect(result["/users/{id}"]).toHaveProperty("get");
      expect(result["/users/{id}"]).toHaveProperty("put");
      expect(result["/users/{id}"]).toHaveProperty("patch");
      expect(result["/users/{id}"]).toHaveProperty("delete");

      // Check parameters for GET collection
      expect(result["/users"].get.parameters?.length).toBeGreaterThan(0);
      expect(result["/users"].get.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "page" }),
          expect.objectContaining({ name: "limit" }),
          expect.objectContaining({ name: "sort" }),
          expect.objectContaining({ name: "fields" }),
          expect.objectContaining({ name: "expand" }),
        ]),
      );

      // Check responses
      expect(result["/users"].get.responses).toHaveProperty("200");
      expect(result["/users"].post.responses).toHaveProperty("201");
      expect(result["/users/{id}"].delete.responses).toHaveProperty("204");
    });

    it("should use custom primary key if specified", () => {
      const resource: Resource = {
        name: "products",
        primaryKey: "sku",
        fields: [
          { name: "sku", type: "string" },
          { name: "name", type: "string" },
          { name: "price", type: "number" },
        ],
      };

      const result = generateResourcePaths(resource);

      expect(result).toHaveProperty("/products/{sku}");

      const pathItem = result["/products/{sku}"].get;
      expect(pathItem.parameters?.[0].name).toBe("sku");
      expect(pathItem.parameters?.[0].schema.type).toBe("string");
    });

    it("should generate relationship endpoints for related resources", () => {
      const resource: Resource = {
        name: "users",
        fields: [
          { name: "id", type: "number" },
          { name: "name", type: "string" },
        ],
        relationships: [
          { resource: "posts", foreignKey: "userId" },
          { resource: "comments", foreignKey: "userId" },
        ],
      };

      const result = generateResourcePaths(resource);

      expect(result).toHaveProperty("/users/{id}/posts");
      expect(result).toHaveProperty("/users/{id}/comments");

      const postsPath = result["/users/{id}/posts"].get;
      expect(postsPath.tags).toContain("users");
      expect(postsPath.tags).toContain("posts");
      expect(postsPath.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "id" }),
          expect.objectContaining({ name: "page" }),
          expect.objectContaining({ name: "limit" }),
        ]),
      );

      const responseSchema =
        postsPath.responses["200"].content?.["application/json"].schema;
      expect(responseSchema?.properties?.data.items.$ref).toBe(
        "#/components/schemas/posts",
      );
    });

    it("should handle singular/plural resource names correctly", () => {
      const resource: Resource = {
        name: "categories",
        fields: [
          { name: "id", type: "number" },
          { name: "name", type: "string" },
        ],
      };

      const result = generateResourcePaths(resource);

      expect(result["/categories"].post.summary).toBe("Create a new category");
      expect(result["/categories/{id}"].get.summary).toBe(
        "Get a category by id",
      );
      expect(result["/categories/{id}"].put.description).toBe(
        "Replaces a category resource",
      );
    });
  });
});
