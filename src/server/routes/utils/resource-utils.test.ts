import { describe, it, expect, vi } from "vitest";
import { getResourceOrError } from "./resource-utils.js";
import { sendResourceNotFoundError } from "./error-responses.js";

// Mock the error response function
vi.mock("./error-responses.js", () => ({
  sendResourceNotFoundError: vi.fn(),
}));

describe("Resource Utilities", () => {
  describe("getResourceOrError", () => {
    it("should return the resource when found", async () => {
      // Setup mocks
      const mockResource = { name: "users" };
      const mockDb = {
        getResource: vi.fn().mockReturnValue({
          ok: true,
          value: mockResource,
        }),
      };
      const mockReq = {
        params: {
          resource: "users",
        },
      };
      const mockRes = {};

      // Test the function
      const result = await getResourceOrError(mockReq, mockRes, mockDb);

      // Verify the resource is returned
      expect(result.ok).toBe(true);
      expect(result.value).toBe(mockResource);
      expect(mockDb.getResource).toHaveBeenCalledWith("users");
      expect(sendResourceNotFoundError).not.toHaveBeenCalled();
    });

    it("should send error and return not-ok result when resource not found", async () => {
      // Setup mocks
      const mockError = new Error("Resource not found");
      const mockDb = {
        getResource: vi.fn().mockReturnValue({
          ok: false,
          error: mockError,
        }),
      };
      const mockReq = {
        params: {
          resource: "nonexistent",
        },
      };
      const mockRes = {};

      // Test the function
      const result = await getResourceOrError(mockReq, mockRes, mockDb);

      // Verify error response was sent
      expect(result.ok).toBe(false);
      expect(mockDb.getResource).toHaveBeenCalledWith("nonexistent");
      expect(sendResourceNotFoundError).toHaveBeenCalledWith(
        mockRes,
        "nonexistent",
      );
    });
  });
});
