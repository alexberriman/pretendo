import { describe, it, expect, vi } from "vitest";
import {
  sendResourceNotFoundError,
  sendRecordNotFoundError,
  sendForbiddenOwnershipError,
  sendOperationError,
} from "./error-responses.js";

describe("Error Response Utilities", () => {
  // Create a mock Response object for testing
  const createMockResponse = () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    return res;
  };

  describe("sendResourceNotFoundError", () => {
    it("should send a 404 error with appropriate error content", () => {
      const res = createMockResponse();
      const resourceName = "users";

      sendResourceNotFoundError(res, resourceName);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 404,
        message: "Resource 'users' not found",
        code: "RESOURCE_NOT_FOUND",
      });
    });
  });

  describe("sendRecordNotFoundError", () => {
    it("should send a 404 error with appropriate error content for numeric ID", () => {
      const res = createMockResponse();
      const resourceName = "users";
      const id = 123;

      sendRecordNotFoundError(res, resourceName, id);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 404,
        message: "users with id 123 not found",
        code: "RECORD_NOT_FOUND",
      });
    });

    it("should send a 404 error with appropriate error content for string ID", () => {
      const res = createMockResponse();
      const resourceName = "users";
      const id = "abc123";

      sendRecordNotFoundError(res, resourceName, id);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 404,
        message: "users with id abc123 not found",
        code: "RECORD_NOT_FOUND",
      });
    });
  });

  describe("sendForbiddenOwnershipError", () => {
    it("should send a 403 error for standard ownership failure", () => {
      const res = createMockResponse();

      sendForbiddenOwnershipError(res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 403,
        message: "Insufficient permissions - not the owner",
        code: "FORBIDDEN_NOT_OWNER",
      });
    });

    it("should send a 403 error for strict ownership failure", () => {
      const res = createMockResponse();

      sendForbiddenOwnershipError(res, true);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 403,
        message: "Insufficient permissions - strict owner check failed",
        code: "FORBIDDEN_STRICT_OWNER",
      });
    });
  });

  describe("sendOperationError", () => {
    it("should send a 500 error by default", () => {
      const res = createMockResponse();
      const operation = "create";
      const details = "Invalid data format";

      sendOperationError(res, operation, details);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 500,
        message: "Failed to create resource",
        details: "Invalid data format",
      });
    });

    it("should send a custom status code when provided", () => {
      const res = createMockResponse();
      const operation = "update";
      const details = "Invalid data format";
      const status = 400;

      sendOperationError(res, operation, details, status);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 400,
        message: "Failed to update resource",
        details: "Invalid data format",
      });
    });
  });
});
