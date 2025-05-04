import { describe, it, expect, vi, beforeEach } from "vitest";
import { initialize } from "./initialize.js";
import { ApiConfig, Store } from "../../types/index.js";
import { PersistenceManager } from "../persistence.js";
import { ok, err } from "../../types/index.js";

describe("initialize", () => {
  // Mock dependencies
  let mockStore: Store;
  let mockPersistenceManager: PersistenceManager;

  // Mock factory functions
  let mockCreateStore: ReturnType<typeof vi.fn>;
  let mockCreatePersistenceManager: ReturnType<typeof vi.fn>;

  // Mock setters
  const mockSetStore = vi.fn();
  const mockSetPersistenceManager = vi.fn();

  // Test config
  const testConfig: ApiConfig = {
    resources: [],
    options: { dbPath: "./test.json" },
  } as unknown as ApiConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mocks
    mockStore = { getData: vi.fn() } as unknown as Store;
    mockPersistenceManager = {
      loadFromFile: vi.fn().mockResolvedValue(ok(undefined)),
      saveToFile: vi.fn().mockResolvedValue(ok(undefined)),
    } as unknown as PersistenceManager;

    mockCreateStore = vi.fn().mockReturnValue(mockStore);
    mockCreatePersistenceManager = vi
      .fn()
      .mockReturnValue(mockPersistenceManager);
  });

  it("should create store and persistence manager with provided config", async () => {
    // Setup success path
    mockPersistenceManager.loadFromFile.mockResolvedValueOnce(ok(undefined));

    // Call the function
    const result = await initialize(
      testConfig,
      mockCreateStore,
      mockCreatePersistenceManager,
      mockStore,
      mockSetPersistenceManager,
      mockSetStore,
    );

    // Verify the result
    expect(result.ok).toBe(true);

    // Verify function calls
    expect(mockCreateStore).toHaveBeenCalledTimes(1);
    expect(mockCreatePersistenceManager).toHaveBeenCalledTimes(1);
    expect(mockCreatePersistenceManager).toHaveBeenCalledWith(mockStore, {
      dbPath: "./test.json",
    });
    expect(mockSetStore).toHaveBeenCalledWith(mockStore);
    expect(mockSetPersistenceManager).toHaveBeenCalledWith(
      mockPersistenceManager,
    );

    // Verify that loadFromFile was called
    expect(mockPersistenceManager.loadFromFile).toHaveBeenCalledTimes(1);
    // And that saveToFile was not called (since loadFromFile succeeded)
    expect(mockPersistenceManager.saveToFile).not.toHaveBeenCalled();
  });

  it("should save initial data if loading fails", async () => {
    // Setup failure path for loadFromFile but success for saveToFile
    mockPersistenceManager.loadFromFile.mockResolvedValueOnce(
      err(new Error("File not found")),
    );
    mockPersistenceManager.saveToFile.mockResolvedValueOnce(ok(undefined));

    // Call the function
    const result = await initialize(
      testConfig,
      mockCreateStore,
      mockCreatePersistenceManager,
      mockStore,
      mockSetPersistenceManager,
      mockSetStore,
    );

    // Verify the result
    expect(result.ok).toBe(true);

    // Verify that saveToFile was called
    expect(mockPersistenceManager.saveToFile).toHaveBeenCalledTimes(1);
  });

  it("should propagate errors from loadFromFile", async () => {
    // Setup failure path with a specific error
    const testError = new Error("Load failed");
    mockPersistenceManager.loadFromFile.mockResolvedValueOnce(err(testError));
    mockPersistenceManager.saveToFile.mockResolvedValueOnce(err(testError));

    // Call the function
    const result = await initialize(
      testConfig,
      mockCreateStore,
      mockCreatePersistenceManager,
      mockStore,
      mockSetPersistenceManager,
      mockSetStore,
    );

    // Verify the result
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Just verify it's an error
      expect(result.error).toBeInstanceOf(Error);
    }
  });

  it("should handle exceptions during initialization", async () => {
    // Setup exception
    mockCreateStore.mockImplementationOnce(() => {
      throw new Error("Failed to create store");
    });

    // Call the function
    const result = await initialize(
      testConfig,
      mockCreateStore,
      mockCreatePersistenceManager,
      mockStore,
      mockSetPersistenceManager,
      mockSetStore,
    );

    // Verify the result
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Failed to create store");
    }
  });
});
