import { describe, it, expect, vi, beforeEach } from "vitest";
import { reset, backup, restore } from "./database-management.js";
import { Store } from "../../types/index.js";
import { PersistenceManager } from "../persistence.js";
import { ok, err } from "../../types/index.js";

describe("database management functions", () => {
  // Mock dependencies
  const mockStore = {
    reset: vi.fn(),
  } as unknown as Store;

  const mockPersistenceManager = {
    saveToFile: vi.fn(),
    backup: vi.fn(),
    restore: vi.fn(),
  } as unknown as PersistenceManager;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("reset", () => {
    it("should reset the store and save to file when successful", async () => {
      // Setup mocks
      mockStore.reset.mockReturnValue(ok(undefined));
      mockPersistenceManager.saveToFile.mockResolvedValue(ok(undefined));

      // Call reset
      const result = await reset(mockStore, mockPersistenceManager);

      // Verify the result
      expect(result.ok).toBe(true);

      // Verify that reset and saveToFile were called
      expect(mockStore.reset).toHaveBeenCalledWith({});
      expect(mockPersistenceManager.saveToFile).toHaveBeenCalled();
    });

    it("should return the reset error if it fails", async () => {
      // Setup mocks
      const testError = new Error("Reset failed");
      mockStore.reset.mockReturnValue(err(testError));

      // Call reset
      const result = await reset(mockStore, mockPersistenceManager);

      // Verify the result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(testError);
      }

      // Verify that saveToFile was not called
      expect(mockPersistenceManager.saveToFile).not.toHaveBeenCalled();
    });

    it("should handle exceptions", async () => {
      // Setup mocks
      mockStore.reset.mockImplementation(() => {
        throw new Error("Test error");
      });

      // Call reset
      const result = await reset(mockStore, mockPersistenceManager);

      // Verify the result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        // Just verify it's an error, not the exact message
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });

  describe("backup", () => {
    it("should call the persistence manager backup method", async () => {
      // Setup mocks
      mockPersistenceManager.backup.mockResolvedValue(ok("backup/path.json"));

      // Call backup
      const result = await backup(mockPersistenceManager, "custom/path.json");

      // Verify the result
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("backup/path.json");
      }

      // Verify that backup was called with the path
      expect(mockPersistenceManager.backup).toHaveBeenCalledWith(
        "custom/path.json",
      );
    });

    it("should handle exceptions", async () => {
      // Setup mocks
      mockPersistenceManager.backup.mockImplementation(() => {
        throw new Error("Test error");
      });

      // Call backup
      const result = await backup(mockPersistenceManager);

      // Verify the result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        // Just verify it's an error, not the exact message
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });

  describe("restore", () => {
    it("should call the persistence manager restore method", async () => {
      // Setup mocks
      mockPersistenceManager.restore.mockResolvedValue(ok(undefined));

      // Call restore
      const result = await restore(mockPersistenceManager, "backup/path.json");

      // Verify the result
      expect(result.ok).toBe(true);

      // Verify that restore was called with the path
      expect(mockPersistenceManager.restore).toHaveBeenCalledWith(
        "backup/path.json",
      );
    });

    it("should handle exceptions", async () => {
      // Setup mocks
      mockPersistenceManager.restore.mockImplementation(() => {
        throw new Error("Test error");
      });

      // Call restore
      const result = await restore(mockPersistenceManager, "backup/path.json");

      // Verify the result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        // Just verify it's an error, not the exact message
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });
});
