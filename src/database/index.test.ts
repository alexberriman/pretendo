import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDatabaseService } from "./index.js";
import { ApiConfig, DatabaseService } from "../types/index.js";
import { ok, err } from "../types/index.js";

// Mock the adapter system
vi.mock("./adapters/index.js", () => ({
  createAdapter: vi.fn(),
  createAdapterResourceOperations: vi.fn(),
}));

// Mock the resource config module
vi.mock("./service/index.js", () => ({
  getResourceConfig: vi.fn(),
}));

// Import mocked functions
import {
  createAdapter,
  createAdapterResourceOperations,
} from "./adapters/index.js";
import { getResourceConfig } from "./service/index.js";

describe("createDatabaseService", () => {
  // Mock objects
  const mockAdapter = {
    initialize: vi.fn().mockResolvedValue(ok(undefined)),
    getResources: vi.fn().mockResolvedValue(ok([])),
    getResource: vi.fn().mockResolvedValue(ok(null)),
    createResource: vi.fn().mockResolvedValue(ok({})),
    updateResource: vi.fn().mockResolvedValue(ok({})),
    patchResource: vi.fn().mockResolvedValue(ok({})),
    deleteResource: vi.fn().mockResolvedValue(ok(true)),
    findRelated: vi.fn().mockResolvedValue(ok([])),
    backup: vi.fn().mockResolvedValue(ok("backup/path.json")),
    restore: vi.fn().mockResolvedValue(ok(undefined)),
    reset: vi.fn().mockResolvedValue(ok(undefined)),
    getStats: vi.fn().mockReturnValue({
      users: { count: 3, lastModified: Date.now() },
    }),
  };

  const mockResourceOps = {
    findAll: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    findRelated: vi.fn(),
  };

  // Test config
  const testConfig: ApiConfig = {
    resources: [{ name: "users" }, { name: "posts" }],
    options: {
      database: {
        adapter: "json-file",
        dbPath: "./test-db.json",
      },
    },
  } as unknown as ApiConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock return values
    vi.mocked(createAdapter).mockReturnValue(ok(mockAdapter));
    vi.mocked(createAdapterResourceOperations).mockReturnValue(
      mockResourceOps as any,
    );
    vi.mocked(getResourceConfig).mockReturnValue(ok({ name: "users" } as any));

    // Setup adapter method mocks
    mockAdapter.initialize.mockResolvedValue(ok(undefined));
    mockAdapter.backup.mockResolvedValue(ok("backup/path.json"));
    mockAdapter.restore.mockResolvedValue(ok(undefined));
    mockAdapter.reset.mockResolvedValue(ok(undefined));
    mockAdapter.getStats.mockReturnValue({
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

    // Verify that createAdapter was called
    expect(createAdapter).toHaveBeenCalledWith(
      "json-file",
      expect.objectContaining({
        dbPath: "./test-db.json",
      }),
    );
  });

  describe("service methods", () => {
    let service: DatabaseService;

    beforeEach(() => {
      service = createDatabaseService(testConfig);
    });

    it("should call initialize with config", async () => {
      // Reset mock to ensure we capture the call from the test
      mockAdapter.initialize.mockResolvedValue(ok(undefined));

      // Call initialize
      const result = await service.initialize(testConfig);

      // Verify the result
      expect(result.ok).toBe(true);

      // Verify that createAdapter was called again with updated config
      expect(createAdapter).toHaveBeenCalledWith(
        "json-file",
        expect.objectContaining({
          dbPath: "./test-db.json",
        }),
      );

      // Verify adapter.initialize was called
      expect(mockAdapter.initialize).toHaveBeenCalled();
    });

    it("should call getResource with the resource name", () => {
      // Call getResource
      const result = service.getResource("users");

      // Verify the result
      expect(result.ok).toBe(true);

      // Verify that getResourceConfig was called to check resource exists
      expect(getResourceConfig).toHaveBeenCalledWith(
        "users",
        expect.any(Object),
      );

      // Verify that createAdapterResourceOperations was called
      expect(createAdapterResourceOperations).toHaveBeenCalledWith(
        "users",
        mockAdapter,
      );
    });

    it("should call reset", async () => {
      // Call reset
      const result = await service.reset();

      // Verify the result
      expect(result.ok).toBe(true);

      // Verify that adapter.reset was called
      expect(mockAdapter.reset).toHaveBeenCalled();
    });

    it("should call backup with optional path", async () => {
      // Call backup
      const result = await service.backup("custom/path.json");

      // Verify the result
      expect(result.ok).toBe(true);
      expect(result.value).toBe("backup/path.json");

      // Verify that adapter.backup was called
      expect(mockAdapter.backup).toHaveBeenCalledWith("custom/path.json");
    });

    it("should call restore with path", async () => {
      // Call restore
      const result = await service.restore("backup/path.json");

      // Verify the result
      expect(result.ok).toBe(true);

      // Verify that adapter.restore was called
      expect(mockAdapter.restore).toHaveBeenCalledWith("backup/path.json");
    });

    it("should call getStats", () => {
      // Call getStats
      const stats = service.getStats();

      // Verify the result
      expect(stats).toEqual({
        users: { count: 3, lastModified: expect.any(Number) },
      });

      // Verify that adapter.getStats was called
      expect(mockAdapter.getStats).toHaveBeenCalled();
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
      mockAdapter.initialize.mockResolvedValue(err(testError));

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
      vi.mocked(getResourceConfig).mockReturnValue(err(testError));

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
      mockAdapter.reset.mockResolvedValue(err(testError));

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
