import { describe, it, expect } from "vitest";
import { convertToOpenApi } from "./converter.js";
import { ApiConfig } from "../../types/index.js";

describe("converter", () => {
  describe("convertToOpenApi", () => {
    it("should convert a basic API config to OpenAPI spec", () => {
      const config: ApiConfig = {
        resources: [
          {
            name: "users",
            fields: [
              { name: "id", type: "number" },
              { name: "name", type: "string" },
              { name: "email", type: "string" },
            ],
          },
        ],
        options: {
          port: 3000,
          host: "localhost",
        },
      };

      const result = convertToOpenApi(config);

      // Check basic structure
      expect(result).toHaveProperty("openapi", "3.0.3");
      expect(result).toHaveProperty("info");
      expect(result).toHaveProperty("paths");
      expect(result).toHaveProperty("components");
      expect(result.components).toHaveProperty("schemas");

      // Check that user resource is defined
      expect(result.components.schemas).toHaveProperty("users");

      // Check paths are created
      expect(result.paths).toHaveProperty("/users");
      expect(result.paths).toHaveProperty("/users/{id}");

      // Check operations are defined
      expect(result.paths["/users"]).toHaveProperty("get");
      expect(result.paths["/users"]).toHaveProperty("post");
      expect(result.paths["/users/{id}"]).toHaveProperty("get");
      expect(result.paths["/users/{id}"]).toHaveProperty("put");
      expect(result.paths["/users/{id}"]).toHaveProperty("patch");
      expect(result.paths["/users/{id}"]).toHaveProperty("delete");

      // Check admin routes are included
      expect(result.paths).toHaveProperty("/__reset");
      expect(result.paths).toHaveProperty("/__backup");
      expect(result.paths).toHaveProperty("/__restore");
    });

    it("should include authentication endpoints if auth is enabled", () => {
      const config: ApiConfig = {
        resources: [
          {
            name: "posts",
            fields: [
              { name: "id", type: "number" },
              { name: "title", type: "string" },
              { name: "content", type: "string" },
            ],
          },
        ],
        options: {
          auth: {
            enabled: true,
            users: [{ username: "admin", password: "password", role: "admin" }],
          },
        },
      };

      const result = convertToOpenApi(config);

      // Check auth routes
      expect(result.paths).toHaveProperty("/auth/login");
      expect(result.paths).toHaveProperty("/auth/logout");

      // Check security schemes
      expect(result.components).toHaveProperty("securitySchemes");
      expect(result.components.securitySchemes).toHaveProperty("BearerAuth");
    });

    it("should include custom routes in the OpenAPI spec", () => {
      const config: ApiConfig = {
        resources: [
          {
            name: "products",
            fields: [
              { name: "id", type: "number" },
              { name: "name", type: "string" },
              { name: "price", type: "number" },
            ],
          },
        ],
        routes: [
          {
            path: "/status",
            method: "get",
            type: "json",
            response: {
              status: "online",
              version: "1.0.0",
            },
            description: "API status endpoint",
          },
          {
            path: "/products/:id/related",
            method: "get",
            type: "javascript",
            code: "// Code for finding related products",
            description: "Get related products",
          },
        ],
      };

      const result = convertToOpenApi(config);

      // Check custom routes
      expect(result.paths).toHaveProperty("/status");
      expect(result.paths).toHaveProperty("/products/{id}/related");

      // Check operations
      expect(result.paths["/status"]).toHaveProperty("get");
      expect(result.paths["/products/{id}/related"]).toHaveProperty("get");

      // Check for path parameters
      expect(
        result.paths["/products/{id}/related"].get.parameters,
      ).toHaveLength(1);
      expect(
        result.paths["/products/{id}/related"].get.parameters[0].name,
      ).toBe("id");
    });

    it("should include examples when initialData is available", () => {
      const config: ApiConfig = {
        resources: [
          {
            name: "users",
            fields: [
              { name: "id", type: "number" },
              { name: "name", type: "string" },
            ],
            initialData: [
              { id: 1, name: "John Doe" },
              { id: 2, name: "Jane Smith" },
            ],
          },
        ],
      };

      const result = convertToOpenApi(config);

      expect(result.components).toHaveProperty("examples");
      expect(result.components.examples).toHaveProperty("usersExample");
      expect(result.components.examples.usersExample.value).toEqual({
        id: 1,
        name: "John Doe",
      });
    });

    it("should omit examples component when no initialData is available", () => {
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
      };

      const result = convertToOpenApi(config);

      expect(result.components).not.toHaveProperty("examples");
    });

    it("should omit securitySchemes component when auth is not enabled", () => {
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
          auth: {
            enabled: false,
          },
        },
      };

      const result = convertToOpenApi(config);

      expect(result.components).not.toHaveProperty("securitySchemes");
    });

    it("should handle resources with relationships", () => {
      const config: ApiConfig = {
        resources: [
          {
            name: "users",
            fields: [
              { name: "id", type: "number" },
              { name: "name", type: "string" },
            ],
            relationships: [{ resource: "posts", foreignKey: "userId" }],
          },
          {
            name: "posts",
            fields: [
              { name: "id", type: "number" },
              { name: "userId", type: "number" },
              { name: "title", type: "string" },
            ],
          },
        ],
      };

      const result = convertToOpenApi(config);

      expect(result.paths).toHaveProperty("/users/{id}/posts");
    });
  });
});
