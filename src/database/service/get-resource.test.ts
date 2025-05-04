import { describe, it, expect, vi, jest } from "vitest";
import { getResource } from "./get-resource.js";
import { Store } from "../../types/index.js";
import { PersistenceManager } from "../persistence.js";
import { RelationshipExpander } from "../relations.js";
import { ApiConfig, ResourceOperation } from "../../types/index.js";
import { ok, err } from "../../types/index.js";

// Mock dependencies
vi.mock("./resource-key.js", () => ({
  getResourcePrimaryKey: vi.fn(),
}));

vi.mock("./resource-operations.js", () => ({
  createResourceOperations: vi.fn(),
}));

import { getResourcePrimaryKey } from "./resource-key.js";
import { createResourceOperations } from "./resource-operations.js";

describe("getResource", () => {
  // Test data
  const testConfig: ApiConfig = {
    resources: [{ name: "users", primaryKey: "userId" }],
  } as unknown as ApiConfig;

  const mockStore = {} as unknown as Store;
  const mockPersistenceManager = {} as unknown as PersistenceManager;
  const mockRelationshipExpander = {} as unknown as RelationshipExpander;

  // Mock resource operations
  const mockResourceOps: ResourceOperation = {
    findAll: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    findRelated: vi.fn(),
  } as unknown as ResourceOperation;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createResourceOperations).mockReturnValue(mockResourceOps);
  });

  it("should return resource operations when resource exists", () => {
    // Setup mocks
    vi.mocked(getResourcePrimaryKey).mockReturnValueOnce(ok("userId"));

    // Call the function
    const result = getResource(
      "users",
      testConfig,
      mockStore,
      mockPersistenceManager,
      mockRelationshipExpander,
    );

    // Verify the result
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(mockResourceOps);
    }

    // Verify function calls
    expect(getResourcePrimaryKey).toHaveBeenCalledWith("users", testConfig);
    expect(createResourceOperations).toHaveBeenCalledWith(
      "users",
      "userId",
      mockStore,
      mockPersistenceManager,
      mockRelationshipExpander,
    );
  });

  it("should return an error when resource does not exist", () => {
    // Setup mocks
    const testError = new Error("Resource not found");
    vi.mocked(getResourcePrimaryKey).mockReturnValueOnce(err(testError));

    // Call the function
    const result = getResource(
      "nonExistent",
      testConfig,
      mockStore,
      mockPersistenceManager,
      mockRelationshipExpander,
    );

    // Verify the result
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(testError);
    }

    // Verify that createResourceOperations was not called
    expect(createResourceOperations).not.toHaveBeenCalled();
  });
});
