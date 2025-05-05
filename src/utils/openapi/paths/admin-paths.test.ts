import { describe, it, expect } from "vitest";
import { generateAdminPaths } from "./admin-paths.js";

describe("admin-paths", () => {
  describe("generateAdminPaths", () => {
    it("should generate admin route paths", () => {
      const result = generateAdminPaths();

      expect(result).toHaveProperty("/__reset");
      expect(result).toHaveProperty("/__backup");
      expect(result).toHaveProperty("/__restore");
    });

    it("should define reset route correctly", () => {
      const result = generateAdminPaths();
      const resetPath = result["/__reset"].post;

      expect(resetPath.summary).toBe("Reset database");
      expect(resetPath.tags).toContain("admin");
      expect(resetPath.security).toEqual([{ BearerAuth: [] }]);

      expect(resetPath.responses).toHaveProperty("204");
      expect(resetPath.responses).toHaveProperty("401");
      expect(resetPath.responses).toHaveProperty("403");
      expect(resetPath.responses).toHaveProperty("500");
    });

    it("should define backup route correctly", () => {
      const result = generateAdminPaths();
      const backupPath = result["/__backup"].post;

      expect(backupPath.summary).toBe("Backup database");
      expect(backupPath.requestBody).toBeDefined();
      expect(
        backupPath.requestBody?.content?.["application/json"].schema.properties,
      ).toHaveProperty("path");

      expect(
        backupPath.responses["200"].content?.["application/json"].schema
          .properties,
      ).toHaveProperty("path");
    });

    it("should define restore route correctly", () => {
      const result = generateAdminPaths();
      const restorePath = result["/__restore"].post;

      expect(restorePath.summary).toBe("Restore database");
      expect(restorePath.requestBody).toBeDefined();

      const schema =
        restorePath.requestBody?.content?.["application/json"].schema;
      expect(schema.required).toContain("path");
      expect(schema.properties).toHaveProperty("path");
    });

    it("should include security requirements for all admin routes", () => {
      const result = generateAdminPaths();

      expect(result["/__reset"].post.security).toEqual([{ BearerAuth: [] }]);
      expect(result["/__backup"].post.security).toEqual([{ BearerAuth: [] }]);
      expect(result["/__restore"].post.security).toEqual([{ BearerAuth: [] }]);
    });
  });
});
