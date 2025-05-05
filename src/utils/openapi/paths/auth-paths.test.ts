import { describe, it, expect } from "vitest";
import { generateAuthPaths } from "./auth-paths.js";

describe("auth-paths", () => {
  describe("generateAuthPaths", () => {
    it("should generate authentication route paths", () => {
      const result = generateAuthPaths();

      expect(result).toHaveProperty("/auth/login");
      expect(result).toHaveProperty("/auth/logout");
    });

    it("should define login route correctly", () => {
      const result = generateAuthPaths();
      const loginPath = result["/auth/login"].post;

      expect(loginPath.summary).toBe("Login");
      expect(loginPath.tags).toContain("authentication");

      // Check request body
      const requestSchema =
        loginPath.requestBody?.content?.["application/json"].schema;
      expect(requestSchema?.required).toContain("username");
      expect(requestSchema?.required).toContain("password");
      expect(requestSchema?.properties).toHaveProperty("username");
      expect(requestSchema?.properties).toHaveProperty("password");

      // Check response
      const responseSchema =
        loginPath.responses["200"].content?.["application/json"].schema;
      expect(responseSchema?.properties).toHaveProperty("token");
      expect(responseSchema?.properties).toHaveProperty("user");
      expect(responseSchema?.properties).toHaveProperty("expiresAt");

      // Check user object
      const userSchema = responseSchema?.properties?.user;
      expect(userSchema.properties).toHaveProperty("id");
      expect(userSchema.properties).toHaveProperty("username");
      expect(userSchema.properties).toHaveProperty("role");

      // Check error responses
      expect(loginPath.responses).toHaveProperty("401");
    });

    it("should define logout route correctly", () => {
      const result = generateAuthPaths();
      const logoutPath = result["/auth/logout"].post;

      expect(logoutPath.summary).toBe("Logout");
      expect(logoutPath.tags).toContain("authentication");

      // Check security
      expect(logoutPath.security).toEqual([{ BearerAuth: [] }]);

      // Check responses
      expect(logoutPath.responses).toHaveProperty("204");
      expect(logoutPath.responses).toHaveProperty("401");
    });
  });
});
