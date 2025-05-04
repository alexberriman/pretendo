import { describe, it, expect, vi, beforeEach } from "vitest";
import { getResourceRecordWithOwnershipCheck } from "./update-utils.js";

// Mock dependencies
vi.mock("./request-utils.js", () => {
  return {
    parseResourceId: vi.fn(() => 123),
    checkOwnership: vi.fn(() => true),
  };
});

vi.mock("./resource-utils.js", () => ({
  getResourceOrError: vi.fn(),
}));

vi.mock("./error-responses.js", () => ({
  sendResourceNotFoundError: vi.fn(),
  sendRecordNotFoundError: vi.fn(),
  sendForbiddenOwnershipError: vi.fn(),
  sendOperationError: vi.fn(),
}));

// Import mocked modules
import { parseResourceId, checkOwnership } from "./request-utils.js";
import { getResourceOrError } from "./resource-utils.js";
import {
  sendResourceNotFoundError,
  sendRecordNotFoundError,
  sendForbiddenOwnershipError,
  sendOperationError,
} from "./error-responses.js";

describe("Update Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getResourceRecordWithOwnershipCheck", () => {
    it("should return resource, id, and record when all checks pass", async () => {
      // Mock successful resource lookup
      const mockResource = { name: "users", findById: vi.fn() };
      getResourceOrError.mockResolvedValue({
        ok: true,
        value: mockResource,
      });

      // Mock successful record lookup
      const mockRecord = { id: 123, name: "Test User" };
      mockResource.findById = vi.fn().mockResolvedValue({
        ok: true,
        value: mockRecord,
      });

      // Mock successful ownership check
      checkOwnership.mockReturnValue(true);

      // Setup request
      const mockReq = {
        params: {
          resource: "users",
          id: "123",
        },
      };
      const mockRes = {};
      const mockDb = {};
      const options = {
        operation: "update",
        logContext: "test",
      };

      // Test the function
      const result = await getResourceRecordWithOwnershipCheck(
        mockReq,
        mockRes,
        mockDb,
        options,
      );

      // Verify results
      expect(result.ok).toBe(true);
      expect(result.value.resource).toBe(mockResource);
      expect(result.value.record).toBe(mockRecord);

      // Verify function calls
      expect(getResourceOrError).toHaveBeenCalledWith(mockReq, mockRes, mockDb);
      expect(parseResourceId).toHaveBeenCalledWith("123");
      expect(mockResource.findById).toHaveBeenCalledWith(123);
      expect(checkOwnership).toHaveBeenCalledWith(mockReq, mockRecord, {
        logContext: "test",
      });

      // Verify no error responses were sent
      expect(sendResourceNotFoundError).not.toHaveBeenCalled();
      expect(sendRecordNotFoundError).not.toHaveBeenCalled();
      expect(sendForbiddenOwnershipError).not.toHaveBeenCalled();
      expect(sendOperationError).not.toHaveBeenCalled();
    });

    it("should return not-ok result when resource not found", async () => {
      // Mock failed resource lookup
      getResourceOrError.mockResolvedValue({
        ok: false,
        error: null,
      });

      // Setup request
      const mockReq = {
        params: {
          resource: "nonexistent",
          id: "123",
        },
      };
      const mockRes = {};
      const mockDb = {};
      const options = {
        operation: "update",
        logContext: "test",
      };

      // Test the function
      const result = await getResourceRecordWithOwnershipCheck(
        mockReq,
        mockRes,
        mockDb,
        options,
      );

      // Verify results
      expect(result.ok).toBe(false);

      // Verify function calls
      expect(getResourceOrError).toHaveBeenCalledWith(mockReq, mockRes, mockDb);

      // Error already sent by getResourceOrError
      expect(sendResourceNotFoundError).not.toHaveBeenCalled();
      expect(sendRecordNotFoundError).not.toHaveBeenCalled();
      expect(sendForbiddenOwnershipError).not.toHaveBeenCalled();
      expect(sendOperationError).not.toHaveBeenCalled();
    });

    it("should send operation error and return not-ok result when findById fails", async () => {
      // Mock successful resource lookup
      const mockResource = { name: "users", findById: vi.fn() };
      getResourceOrError.mockResolvedValue({
        ok: true,
        value: mockResource,
      });

      // Mock failed record lookup
      const mockError = new Error("Database error");
      mockResource.findById = vi.fn().mockResolvedValue({
        ok: false,
        error: mockError,
      });

      // Setup request
      const mockReq = {
        params: {
          resource: "users",
          id: "123",
        },
      };
      const mockRes = {};
      const mockDb = {};
      const options = {
        operation: "update",
        logContext: "test",
      };

      // Test the function
      const result = await getResourceRecordWithOwnershipCheck(
        mockReq,
        mockRes,
        mockDb,
        options,
      );

      // Verify results
      expect(result.ok).toBe(false);

      // Verify function calls
      expect(getResourceOrError).toHaveBeenCalledWith(mockReq, mockRes, mockDb);
      expect(mockResource.findById).toHaveBeenCalledWith(123);

      // Verify error response was sent
      expect(sendOperationError).toHaveBeenCalledWith(
        mockRes,
        "update",
        mockError.message,
        500,
      );
    });

    it("should send record not found error and return not-ok result when record not found", async () => {
      // Mock successful resource lookup
      const mockResource = { name: "users", findById: vi.fn() };
      getResourceOrError.mockResolvedValue({
        ok: true,
        value: mockResource,
      });

      // Mock successful but empty record lookup
      mockResource.findById = vi.fn().mockResolvedValue({
        ok: true,
        value: null, // No record found
      });

      // Setup request
      const mockReq = {
        params: {
          resource: "users",
          id: "123",
        },
      };
      const mockRes = {};
      const mockDb = {};
      const options = {
        operation: "update",
        logContext: "test",
      };

      // Test the function
      const result = await getResourceRecordWithOwnershipCheck(
        mockReq,
        mockRes,
        mockDb,
        options,
      );

      // Verify results
      expect(result.ok).toBe(false);

      // Verify function calls
      expect(getResourceOrError).toHaveBeenCalledWith(mockReq, mockRes, mockDb);
      expect(mockResource.findById).toHaveBeenCalledWith(123);

      // Verify error response was sent
      expect(sendRecordNotFoundError).toHaveBeenCalledWith(
        mockRes,
        "users",
        "123",
      );
    });

    it("should send forbidden error and return not-ok result when ownership check fails", async () => {
      // Mock successful resource lookup
      const mockResource = { name: "users", findById: vi.fn() };
      getResourceOrError.mockResolvedValue({
        ok: true,
        value: mockResource,
      });

      // Mock successful record lookup
      const mockRecord = { id: 123, name: "Test User" };
      mockResource.findById = vi.fn().mockResolvedValue({
        ok: true,
        value: mockRecord,
      });

      // Mock failed ownership check
      checkOwnership.mockReturnValue(false);

      // Setup request with strict ownership check
      const mockReq = {
        params: {
          resource: "users",
          id: "123",
        },
        strictOwnerCheck: true,
      };
      const mockRes = {};
      const mockDb = {};
      const options = {
        operation: "update",
        logContext: "test",
      };

      // Test the function
      const result = await getResourceRecordWithOwnershipCheck(
        mockReq,
        mockRes,
        mockDb,
        options,
      );

      // Verify results
      expect(result.ok).toBe(false);

      // Verify function calls
      expect(getResourceOrError).toHaveBeenCalledWith(mockReq, mockRes, mockDb);
      expect(mockResource.findById).toHaveBeenCalledWith(123);
      expect(checkOwnership).toHaveBeenCalledWith(mockReq, mockRecord, {
        logContext: "test",
      });

      // Verify error response was sent
      expect(sendForbiddenOwnershipError).toHaveBeenCalledWith(
        mockRes,
        true, // strictOwnerCheck
      );
    });
  });
});
