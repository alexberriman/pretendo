import { describe, it, expect } from "vitest";
import { convertToYaml } from "./yaml.js";

describe("yaml", () => {
  describe("convertToYaml", () => {
    it("should convert a simple object to YAML", () => {
      const obj = {
        name: "Test",
        version: "1.0.0",
      };

      const result = convertToYaml(obj);

      expect(result).toContain("name: Test");
      expect(result).toContain("version: 1.0.0");
    });

    it("should convert nested objects to YAML with proper indentation", () => {
      const obj = {
        info: {
          title: "Test API",
          version: "1.0.0",
        },
        paths: {
          "/test": {
            get: {
              summary: "Test endpoint",
            },
          },
        },
      };

      const result = convertToYaml(obj);

      expect(result).toContain("info:");
      expect(result).toContain("  title: Test API");
      expect(result).toContain("  version: 1.0.0");
      expect(result).toContain("paths:");
      expect(result).toContain("  /test:");
      expect(result).toContain("    get:");
      expect(result).toContain("      summary: Test endpoint");
    });

    it("should convert arrays to YAML", () => {
      const obj = {
        tags: ["api", "test", "documentation"],
        servers: [
          {
            url: "https://api.example.com",
            description: "Production",
          },
          {
            url: "https://dev.example.com",
            description: "Development",
          },
        ],
      };

      const result = convertToYaml(obj);

      expect(result).toContain("tags:");
      expect(result).toContain("- api");
      expect(result).toContain("- test");
      expect(result).toContain("- documentation");

      expect(result).toContain("servers:");
      expect(result).toContain("url: https://api.example.com");
      expect(result).toContain("description: Production");
      expect(result).toContain("url: https://dev.example.com");
      expect(result).toContain("description: Development");
    });

    it("should skip null and undefined values", () => {
      const obj = {
        title: "Test",
        description: null,
        version: undefined,
        active: true,
      };

      const result = convertToYaml(obj);

      expect(result).toContain("title: Test");
      expect(result).toContain("active: true");
      expect(result).not.toContain("description");
      expect(result).not.toContain("version");
    });

    it("should handle an empty object", () => {
      const result = convertToYaml({});

      expect(result).toBe("");
    });

    it("should handle complex nested structures", () => {
      const obj = {
        openapi: "3.0.3",
        info: {
          title: "Test API",
          description: "API for testing",
          version: "1.0.0",
        },
        paths: {
          "/users": {
            get: {
              summary: "Get users",
              parameters: [
                {
                  name: "limit",
                  in: "query",
                  schema: { type: "integer" },
                },
              ],
              responses: {
                "200": {
                  description: "Success",
                },
              },
            },
          },
        },
      };

      const result = convertToYaml(obj);

      expect(result).toContain("openapi: 3.0.3");
      expect(result).toContain("info:");
      expect(result).toContain("  title: Test API");
      expect(result).toContain("paths:");
      expect(result).toContain("  /users:");
      expect(result).toContain("    get:");
      expect(result).toContain("      parameters:");
      expect(result).toContain("        name: limit");
      expect(result).toContain("        in: query");
      expect(result).toContain("        schema:");
      expect(result).toContain("          type: integer");
      expect(result).toContain("      responses:");
      expect(result).toContain("        200:");
      expect(result).toContain("          description: Success");
    });
  });
});
