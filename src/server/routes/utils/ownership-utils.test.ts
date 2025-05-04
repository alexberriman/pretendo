import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleOwnershipAssignment } from "./ownership-utils.js";
import { logger } from "../../../utils/debug-logger.js";

// Mock the logger
vi.mock("../../../utils/debug-logger.js", () => ({
  logger: {
    info: vi.fn(),
  },
}));

describe("Ownership Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleOwnershipAssignment", () => {
    it("should return data unchanged when no resource ownership configured", async () => {
      const mockReq = {
        resource: {}, // No ownedBy field
        user: { id: 123, username: "testuser" },
      };
      const mockDb = {};
      const initialData = { name: "Test Record" };

      const result = await handleOwnershipAssignment(
        mockReq,
        mockDb,
        initialData,
      );

      expect(result).toEqual(initialData);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("No owner assignment"),
      );
    });

    it("should return data unchanged when no user available", async () => {
      const mockReq = {
        resource: { ownedBy: "userId" },
        user: null, // No user
      };
      const mockDb = {};
      const initialData = { name: "Test Record" };

      const result = await handleOwnershipAssignment(
        mockReq,
        mockDb,
        initialData,
      );

      expect(result).toEqual(initialData);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("No owner assignment"),
      );
    });

    it("should set owner field using userId from token when available", async () => {
      const mockReq = {
        resource: { ownedBy: "userId" },
        user: { id: 123, username: "testuser" },
      };
      const mockDb = {};
      const initialData = { name: "Test Record" };

      const result = await handleOwnershipAssignment(
        mockReq,
        mockDb,
        initialData,
      );

      expect(result).toEqual({
        name: "Test Record",
        userId: 123,
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Using userId from token: 123"),
      );
    });

    it("should look up userId by username when userId not available", async () => {
      // Mock user with username but no id
      const mockReq = {
        resource: { ownedBy: "userId" },
        user: { username: "testuser" }, // No id provided
        apiConfig: {
          options: {
            auth: {
              userResource: "users",
              usernameField: "username",
            },
          },
        },
      };

      // Mock database with getResource that returns a resource with findOne method
      const mockResource = {
        findOne: vi.fn().mockResolvedValue({
          ok: true,
          value: { id: 456, username: "testuser" },
        }),
      };

      const mockDb = {
        getResource: vi.fn().mockReturnValue({
          ok: true,
          value: mockResource,
        }),
      };

      const initialData = { name: "Test Record" };

      const result = await handleOwnershipAssignment(
        mockReq,
        mockDb,
        initialData,
      );

      expect(result).toEqual({
        name: "Test Record",
        userId: 456,
      });
      expect(mockDb.getResource).toHaveBeenCalledWith("users");
      expect(mockResource.findOne).toHaveBeenCalledWith({
        username: "testuser",
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Found user ID for testuser: 456"),
      );
    });

    it("should handle case when user lookup fails", async () => {
      // Mock user with username but no id
      const mockReq = {
        resource: { ownedBy: "userId" },
        user: { username: "testuser" }, // No id provided
        apiConfig: {
          options: {
            auth: {
              userResource: "users",
              usernameField: "username",
            },
          },
        },
      };

      // Mock database with getResource that returns a resource with findOne method that fails
      const mockResource = {
        findOne: vi.fn().mockResolvedValue({
          ok: false,
          error: new Error("User lookup failed"),
        }),
      };

      const mockDb = {
        getResource: vi.fn().mockReturnValue({
          ok: true,
          value: mockResource,
        }),
      };

      const initialData = { name: "Test Record" };

      const result = await handleOwnershipAssignment(
        mockReq,
        mockDb,
        initialData,
      );

      // Data should remain unchanged since lookup failed
      expect(result).toEqual({
        name: "Test Record",
      });
      expect(mockDb.getResource).toHaveBeenCalledWith("users");
      expect(mockResource.findOne).toHaveBeenCalledWith({
        username: "testuser",
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("User testuser not found"),
      );
    });

    it("should handle case when user resource does not exist", async () => {
      // Mock user with username but no id
      const mockReq = {
        resource: { ownedBy: "userId" },
        user: { username: "testuser" }, // No id provided
        apiConfig: {
          options: {
            auth: {
              userResource: "users",
              usernameField: "username",
            },
          },
        },
      };

      // Mock database with getResource that fails
      const mockDb = {
        getResource: vi.fn().mockReturnValue({
          ok: false,
          error: new Error("Resource not found"),
        }),
      };

      const initialData = { name: "Test Record" };

      const result = await handleOwnershipAssignment(
        mockReq,
        mockDb,
        initialData,
      );

      // Data should remain unchanged since resource not found
      expect(result).toEqual({
        name: "Test Record",
      });
      expect(mockDb.getResource).toHaveBeenCalledWith("users");
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("User resource users not found"),
      );
    });
  });
});
