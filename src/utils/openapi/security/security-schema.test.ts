import { describe, it, expect } from "vitest";
import { generateSecurityScheme } from "./security-schema.js";
import { ApiConfig } from "../../../types/index.js";

describe("security-schema", () => {
  describe("generateSecurityScheme", () => {
    it("should return undefined when auth is not enabled", () => {
      const config: ApiConfig = {
        resources: [],
        options: {
          auth: {
            enabled: false,
          },
        },
      };

      const result = generateSecurityScheme(config);

      expect(result).toBeUndefined();
    });

    it("should return undefined when auth options are not defined", () => {
      const config: ApiConfig = {
        resources: [],
        options: {},
      };

      const result = generateSecurityScheme(config);

      expect(result).toBeUndefined();
    });

    it("should generate security scheme when auth is enabled", () => {
      const config: ApiConfig = {
        resources: [],
        options: {
          auth: {
            enabled: true,
            users: [{ username: "admin", password: "password", role: "admin" }],
          },
        },
      };

      const result = generateSecurityScheme(config);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("BearerAuth");
      expect(result?.BearerAuth.type).toBe("http");
      expect(result?.BearerAuth.scheme).toBe("bearer");
      expect(result?.BearerAuth.bearerFormat).toBe("JWT");
      expect(result?.BearerAuth.description).toBe("JWT token authentication");
    });
  });
});
