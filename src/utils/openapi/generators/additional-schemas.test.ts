import { describe, it, expect } from "vitest";
import { generateAdditionalSchemas } from "./additional-schemas.js";
import { Resource } from "../../../types/index.js";

describe("additional-schemas", () => {
  describe("generateAdditionalSchemas", () => {
    it("should generate additional schemas for resources", () => {
      const resources: Resource[] = [
        {
          name: "users",
          fields: [
            { name: "id", type: "number" },
            { name: "name", type: "string", required: true },
            { name: "email", type: "string", required: true },
          ],
        },
      ];

      const result = generateAdditionalSchemas(resources);

      // Check base schema
      expect(result).toHaveProperty("users");
      expect(result.users.properties).toHaveProperty("id");
      expect(result.users.properties).toHaveProperty("name");
      expect(result.users.properties).toHaveProperty("email");
      expect(result.users.required).toContain("name");
      expect(result.users.required).toContain("email");

      // Check create schema (should omit id)
      expect(result).toHaveProperty("usersCreate");
      expect(result.usersCreate.properties).not.toHaveProperty("id");
      expect(result.usersCreate.properties).toHaveProperty("name");
      expect(result.usersCreate.properties).toHaveProperty("email");

      // Check update schema (should be same as create)
      expect(result).toHaveProperty("usersUpdate");
      expect(result.usersUpdate.properties).not.toHaveProperty("id");
      expect(result.usersUpdate.properties).toHaveProperty("name");
      expect(result.usersUpdate.properties).toHaveProperty("email");

      // Check patch schema (all fields optional)
      expect(result).toHaveProperty("usersPatch");
      expect(result.usersPatch.properties).toHaveProperty("id");
      expect(result.usersPatch.properties).toHaveProperty("name");
      expect(result.usersPatch.properties).toHaveProperty("email");
      expect(result.usersPatch.required).toBeUndefined();
    });

    it("should handle custom primary keys", () => {
      const resources: Resource[] = [
        {
          name: "products",
          primaryKey: "sku",
          fields: [
            { name: "sku", type: "string" },
            { name: "name", type: "string", required: true },
            { name: "price", type: "number", required: true },
          ],
        },
      ];

      const result = generateAdditionalSchemas(resources);

      // Base schema should have sku
      expect(result.products.properties).toHaveProperty("sku");

      // Create schema should omit sku
      expect(result.productsCreate.properties).not.toHaveProperty("sku");

      // Update schema should omit sku
      expect(result.productsUpdate.properties).not.toHaveProperty("sku");

      // Patch schema should have sku but no required fields
      expect(result.productsPatch.properties).toHaveProperty("sku");
      expect(result.productsPatch.required).toBeUndefined();
    });

    it("should handle resources with no required fields", () => {
      const resources: Resource[] = [
        {
          name: "tags",
          fields: [
            { name: "id", type: "number" },
            { name: "name", type: "string" },
            { name: "color", type: "string" },
          ],
        },
      ];

      const result = generateAdditionalSchemas(resources);

      // Check all schemas exist
      expect(result).toHaveProperty("tags");
      expect(result).toHaveProperty("tagsCreate");
      expect(result).toHaveProperty("tagsUpdate");
      expect(result).toHaveProperty("tagsPatch");

      // None should have required fields
      expect(result.tags.required).toBeUndefined();
      expect(result.tagsCreate.required).toBeUndefined();
      expect(result.tagsUpdate.required).toBeUndefined();
      expect(result.tagsPatch.required).toBeUndefined();
    });

    it("should generate schemas for multiple resources", () => {
      const resources: Resource[] = [
        {
          name: "posts",
          fields: [
            { name: "id", type: "number" },
            { name: "title", type: "string", required: true },
            { name: "content", type: "string" },
          ],
        },
        {
          name: "comments",
          fields: [
            { name: "id", type: "number" },
            { name: "postId", type: "number", required: true },
            { name: "text", type: "string", required: true },
          ],
        },
      ];

      const result = generateAdditionalSchemas(resources);

      // Check all resources have base and derivative schemas
      expect(result).toHaveProperty("posts");
      expect(result).toHaveProperty("postsCreate");
      expect(result).toHaveProperty("postsUpdate");
      expect(result).toHaveProperty("postsPatch");

      expect(result).toHaveProperty("comments");
      expect(result).toHaveProperty("commentsCreate");
      expect(result).toHaveProperty("commentsUpdate");
      expect(result).toHaveProperty("commentsPatch");
    });
  });
});
