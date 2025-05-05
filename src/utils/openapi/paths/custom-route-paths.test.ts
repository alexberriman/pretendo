import { describe, it, expect } from "vitest";
import { generateCustomRoutePaths } from "./custom-route-paths.js";
import { CustomRoute } from "../../../types/index.js";

describe("custom-route-paths", () => {
  describe("generateCustomRoutePaths", () => {
    it("should generate paths for basic custom routes", () => {
      const routes: CustomRoute[] = [
        {
          path: "/status",
          method: "GET",
          type: "json",
          response: { status: "ok" },
          description: "API status endpoint",
        },
        {
          path: "/health",
          method: "GET",
          type: "json",
          response: { health: "good" },
        },
      ];

      const result = generateCustomRoutePaths(routes);

      expect(result).toHaveProperty("/status");
      expect(result).toHaveProperty("/health");

      expect(result["/status"].get.summary).toBe("API status endpoint");
      expect(result["/status"].get.tags).toContain("custom-routes");
      expect(result["/status"].get.responses).toHaveProperty("200");

      expect(result["/health"].get.summary).toBe("Custom get endpoint");
    });

    it("should handle routes with path parameters", () => {
      const routes: CustomRoute[] = [
        {
          path: "/users/:userId/profile",
          method: "GET",
          type: "json",
          response: { profile: {} },
          description: "Get user profile",
        },
        {
          path: "/items/:itemId/related/:categoryId",
          method: "GET",
          type: "javascript",
          code: "// custom code",
        },
      ];

      const result = generateCustomRoutePaths(routes);

      expect(result).toHaveProperty("/users/{userId}/profile");
      expect(result).toHaveProperty("/items/{itemId}/related/{categoryId}");

      // Check parameter parsing
      const userProfilePath = result["/users/{userId}/profile"].get;
      expect(userProfilePath.parameters).toHaveLength(1);
      expect(userProfilePath.parameters?.[0].name).toBe("userId");
      expect(userProfilePath.parameters?.[0].in).toBe("path");
      expect(userProfilePath.parameters?.[0].required).toBe(true);

      const relatedItemsPath =
        result["/items/{itemId}/related/{categoryId}"].get;
      expect(relatedItemsPath.parameters).toHaveLength(2);
      expect(relatedItemsPath.parameters?.[0].name).toBe("itemId");
      expect(relatedItemsPath.parameters?.[1].name).toBe("categoryId");
    });

    it("should add request body for POST, PUT, PATCH methods", () => {
      const routes: CustomRoute[] = [
        {
          path: "/messages",
          method: "POST",
          type: "javascript",
          code: "// custom code",
        },
        {
          path: "/user/:id",
          method: "PUT",
          type: "json",
          response: { updated: true },
        },
        {
          path: "/item/:id",
          method: "PATCH",
          type: "json",
          response: { patched: true },
        },
        {
          path: "/status",
          method: "GET",
          type: "json",
          response: { status: "ok" },
        },
      ];

      const result = generateCustomRoutePaths(routes);

      // POST should have request body
      expect(result["/messages"].post.requestBody).toBeDefined();
      expect(
        result["/messages"].post.requestBody?.content?.["application/json"]
          .schema,
      ).toBeDefined();

      // PUT should have request body
      expect(result["/user/{id}"].put.requestBody).toBeDefined();

      // PATCH should have request body
      expect(result["/item/{id}"].patch.requestBody).toBeDefined();

      // GET should not have request body
      expect(result["/status"].get.requestBody).toBeUndefined();
    });

    it("should add auth responses for routes with auth enabled", () => {
      const routes: CustomRoute[] = [
        {
          path: "/public",
          method: "GET",
          type: "json",
          response: { public: true },
        },
        {
          path: "/private",
          method: "GET",
          type: "json",
          response: { private: true },
          auth: { enabled: true },
        },
      ];

      const result = generateCustomRoutePaths(routes);

      // Public route should not have auth responses
      expect(result["/public"].get.responses["401"]).toBeUndefined();
      expect(result["/public"].get.responses["403"]).toBeUndefined();

      // Private route should have auth responses
      expect(result["/private"].get.responses["401"]).toBeDefined();
      expect(result["/private"].get.responses["403"]).toBeDefined();
      expect(result["/private"].get.responses["401"].description).toBe(
        "Unauthorized",
      );
    });
  });
});
