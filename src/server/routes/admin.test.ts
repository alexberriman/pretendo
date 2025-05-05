import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { apiDocsHandler } from "./admin.js";
import * as openApiModule from "../../utils/openapi/index.js";

// Mock the openapi module
vi.mock("../../utils/openapi/index.js", () => ({
  convertToOpenApi: vi.fn().mockReturnValue({ openapi: "3.0.3" }),
  convertToYaml: vi.fn().mockReturnValue("openapi: 3.0.3"),
}));

describe("Admin Routes", () => {
  describe("apiDocsHandler", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
      // Reset mocks
      vi.clearAllMocks();

      // Mock request and response
      req = {
        query: {},
        apiConfig: {
          resources: [
            {
              name: "test",
              fields: [{ name: "id", type: "number" }],
            },
          ],
        },
        user: { id: 1, username: "admin", role: "admin" },
      };

      res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        setHeader: vi.fn(),
      };
    });

    it("should return OpenAPI spec as JSON by default", () => {
      const handler = apiDocsHandler({});
      handler(req as Request, res as Response);

      expect(openApiModule.convertToOpenApi).toHaveBeenCalledWith(
        req.apiConfig,
      );
      expect(res.json).toHaveBeenCalled();
    });

    it("should return OpenAPI spec as YAML when format=yaml", () => {
      const handler = apiDocsHandler({});
      req.query = { format: "yaml" };

      handler(req as Request, res as Response);

      expect(openApiModule.convertToOpenApi).toHaveBeenCalledWith(
        req.apiConfig,
      );
      expect(openApiModule.convertToYaml).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/yaml");
      expect(res.send).toHaveBeenCalled();
    });

    it("should return 404 if docs are disabled", () => {
      const handler = apiDocsHandler({ docs: { enabled: false } });

      handler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 404,
          message: "API documentation is not available",
        }),
      );
    });

    it("should enforce authentication when requireAuth is true", () => {
      const handler = apiDocsHandler({
        docs: { requireAuth: true },
        auth: { enabled: true },
      });
      req.user = undefined;

      handler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 401,
          message: "Authentication required to access API documentation",
        }),
      );
    });

    it("should enforce admin role when requireAuth is true", () => {
      const handler = apiDocsHandler({
        docs: { requireAuth: true },
        auth: { enabled: true },
      });
      req.user = { id: 2, username: "user", role: "user" };

      handler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 403,
          message: "Admin role required to access API documentation",
        }),
      );
    });

    it("should return 500 if API config is not available", () => {
      const handler = apiDocsHandler({});
      req.apiConfig = undefined;

      handler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 500,
          message: "API configuration not available",
        }),
      );
    });

    it("should handle errors during OpenAPI generation", () => {
      const handler = apiDocsHandler({});
      vi.mocked(openApiModule.convertToOpenApi).mockImplementation(() => {
        throw new Error("Test error");
      });

      handler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 500,
          message: "Failed to generate API documentation",
          details: "Test error",
        }),
      );
    });
  });
});
