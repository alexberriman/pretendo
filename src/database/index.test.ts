import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDatabaseService } from "./index.js";
import { ApiConfig, DatabaseService } from "../types/index.js";
import { ok, err } from "../types/index.js";

// Mock the store, persistence manager and relationship expander
vi.mock("./store.js", () => ({
  createStore: vi.fn(),
}));

vi.mock("./persistence.js", () => ({
  createPersistenceManager: vi.fn(),
}));

vi.mock("./relations.js", () => ({
  createRelationshipExpander: vi.fn(),
}));

// Mock the service modules
vi.mock("./service/index.js", () => ({
  initialize: vi.fn(),
  getResource: vi.fn(),
  reset: vi.fn(),
  backup: vi.fn(),
  restore: vi.fn(),
  getStats: vi.fn(),
}));

// Import mocked functions
import { createStore } from "./store.js";
import { createPersistenceManager } from "./persistence.js";
import { createRelationshipExpander } from "./relations.js";
import {
  initialize,
  getResource,
  reset,
  backup,
  restore,
  getStats,
} from "./service/index.js";

describe("createDatabaseService", () => {
  // Mock objects
  const mockStore = {
    getData: vi.fn(),
    getRecord: vi.fn(),
  };

  const mockPersistenceManager = {
    saveToFile: vi.fn(),
    loadFromFile: vi.fn(),
    backup: vi.fn(),
    restore: vi.fn(),
  };

  const mockRelationshipExpander = {
    expandRelationships: vi.fn(),
    getRelationships: vi.fn(),
    findRelatedRecords: vi.fn(),
  };

  // Test config
  const testConfig: ApiConfig = {
    resources: [{ name: "users" }, { name: "posts" }],
    options: {
      dbPath: "./test-db.json",
    },
  } as unknown as ApiConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock return values
    vi.mocked(createStore).mockReturnValue(mockStore as any);
    vi.mocked(createPersistenceManager).mockReturnValue(
      mockPersistenceManager as any,
    );
    vi.mocked(createRelationshipExpander).mockReturnValue(
      mockRelationshipExpander as any,
    );

    // Setup service mocks
    vi.mocked(initialize).mockResolvedValue(ok(undefined));
    vi.mocked(getResource).mockReturnValue(ok({} as any));
    vi.mocked(reset).mockResolvedValue(ok(undefined));
    vi.mocked(backup).mockResolvedValue(ok("backup/path.json"));
    vi.mocked(restore).mockResolvedValue(ok(undefined));
    vi.mocked(getStats).mockReturnValue({
      users: { count: 3, lastModified: Date.now() },
    });
  });

  it("should create a database service with the expected interface", () => {
    // Create the service
    const service = createDatabaseService(testConfig);

    // Verify that it has the expected methods
    expect(service).toHaveProperty("initialize");
    expect(service).toHaveProperty("getResource");
    expect(service).toHaveProperty("reset");
    expect(service).toHaveProperty("backup");
    expect(service).toHaveProperty("restore");
    expect(service).toHaveProperty("getStats");

    // Verify that createStore was called
    expect(createStore).toHaveBeenCalledWith(expect.any(Object));

    // Verify that createPersistenceManager was called
    expect(createPersistenceManager).toHaveBeenCalledWith(mockStore, {
      dbPath: "./test-db.json",
    });

    // Verify that createRelationshipExpander was called
    expect(createRelationshipExpander).toHaveBeenCalledWith(
      expect.any(Object),
      mockStore,
    );
  });

  describe("service methods", () => {
    let service: DatabaseService;

    beforeEach(() => {
      service = createDatabaseService(testConfig);
    });

    it("should call initialize with config", async () => {
      // Call initialize
      const result = await service.initialize(testConfig);

      // Verify the result
      expect(result.ok).toBe(true);

      // Verify that initialize was called
      expect(initialize).toHaveBeenCalledWith(
        testConfig,
        createStore,
        createPersistenceManager,
        mockStore,
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("should call getResource with the resource name", () => {
      // Call getResource
      const result = service.getResource("users");

      // Verify the result
      expect(result.ok).toBe(true);

      // Verify that getResource was called
      expect(getResource).toHaveBeenCalledWith(
        "users",
        expect.any(Object),
        mockStore,
        mockPersistenceManager,
        mockRelationshipExpander,
      );
    });

    it("should call reset", async () => {
      // Call reset
      const result = await service.reset();

      // Verify the result
      expect(result.ok).toBe(true);

      // Verify that reset was called
      expect(reset).toHaveBeenCalledWith(mockStore, mockPersistenceManager);
    });

    it("should call backup with optional path", async () => {
      // Call backup
      const result = await service.backup("custom/path.json");

      // Verify the result
      expect(result.ok).toBe(true);
      expect(result.value).toBe("backup/path.json");

      // Verify that backup was called
      expect(backup).toHaveBeenCalledWith(
        mockPersistenceManager,
        "custom/path.json",
      );
    });

    it("should call restore with path", async () => {
      // Call restore
      const result = await service.restore("backup/path.json");

      // Verify the result
      expect(result.ok).toBe(true);

      // Verify that restore was called
      expect(restore).toHaveBeenCalledWith(
        mockPersistenceManager,
        "backup/path.json",
      );
    });

    it("should call getStats", () => {
      // Call getStats
      const stats = service.getStats();

      // Verify the result
      expect(stats).toEqual({
        users: { count: 3, lastModified: expect.any(Number) },
      });

      // Verify that getStats was called
      expect(getStats).toHaveBeenCalledWith(expect.any(Object), mockStore);
    });
  });

  describe("error handling", () => {
    let service: DatabaseService;

    beforeEach(() => {
      service = createDatabaseService(testConfig);
    });

    it("should handle initialize errors", async () => {
      // Setup error
      const testError = new Error("Initialize failed");
      vi.mocked(initialize).mockResolvedValue(err(testError));

      // Call initialize
      const result = await service.initialize(testConfig);

      // Verify the result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(testError);
      }
    });

    it("should handle getResource errors", () => {
      // Setup error
      const testError = new Error("Resource not found");
      vi.mocked(getResource).mockReturnValue(err(testError));

      // Call getResource
      const result = service.getResource("nonExistent");

      // Verify the result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(testError);
      }
    });

    it("should handle reset errors", async () => {
      // Setup error
      const testError = new Error("Reset failed");
      vi.mocked(reset).mockResolvedValue(err(testError));

      // Call reset
      const result = await service.reset();

      // Verify the result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(testError);
      }
    });
  });
});
