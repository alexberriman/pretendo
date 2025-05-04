import { describe, it, expect, vi, beforeEach } from "vitest";
import { createResourceOperations } from "./resource-operations.js";
import { Store } from "../../types/index.js";
import { PersistenceManager } from "../persistence.js";
import { RelationshipExpander } from "../relations.js";
import { DbRecord, QueryOptions } from "../../types/index.js";
import { ok, err } from "../../types/index.js";

describe("createResourceOperations", () => {
  // Mock dependencies
  const mockStore = {
    query: vi.fn(),
    getRecord: vi.fn(),
    addRecord: vi.fn(),
    updateRecord: vi.fn(),
    deleteRecord: vi.fn(),
  } as unknown as Store;

  const mockPersistenceManager = {
    saveToFile: vi.fn(),
  } as unknown as PersistenceManager;

  const mockRelationshipExpander = {
    expandRelationships: vi.fn(),
    getRelationships: vi.fn(),
    findRelatedRecords: vi.fn(),
  } as unknown as RelationshipExpander;

  // Test data
  const resourceName = "users";
  const primaryKey = "userId";
  const testRecord: DbRecord = { userId: 1, name: "Test User" };
  const testRecords: DbRecord[] = [testRecord];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return all records when query succeeds", async () => {
      // Setup mocks
      mockStore.query.mockReturnValue(ok(testRecords));

      // Create resource operations
      const resourceOps = createResourceOperations(
        resourceName,
        primaryKey,
        mockStore,
        mockPersistenceManager,
        mockRelationshipExpander,
      );

      // Call findAll
      const result = await resourceOps.findAll();

      // Verify the result
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(testRecords);
      }

      // Verify that query was called
      expect(mockStore.query).toHaveBeenCalledWith(resourceName, undefined);
    });

    it("should handle query options", async () => {
      // Setup mocks
      mockStore.query.mockReturnValue(ok(testRecords));

      // Create resource operations
      const resourceOps = createResourceOperations(
        resourceName,
        primaryKey,
        mockStore,
        mockPersistenceManager,
        mockRelationshipExpander,
      );

      // Define query options
      const options: QueryOptions = {
        filters: [{ field: "name", operator: "eq", value: "Test User" }],
        sort: [{ field: "name", order: "asc" }],
        page: 1,
        perPage: 10,
      };

      // Call findAll with options
      const result = await resourceOps.findAll(options);

      // Verify that query was called with options
      expect(mockStore.query).toHaveBeenCalledWith(resourceName, options);
    });

    it("should expand relationships when requested", async () => {
      // Setup mocks
      mockStore.query.mockReturnValue(ok(testRecords));
      mockRelationshipExpander.expandRelationships.mockReturnValue(
        ok([{ ...testRecord, profile: { id: 1 } }]),
      );

      // Create resource operations
      const resourceOps = createResourceOperations(
        resourceName,
        primaryKey,
        mockStore,
        mockPersistenceManager,
        mockRelationshipExpander,
      );

      // Define query options with expand
      const options: QueryOptions = {
        expand: ["profile"],
      };

      // Call findAll with expand
      const result = await resourceOps.findAll(options);

      // Verify that expandRelationships was called
      expect(mockRelationshipExpander.expandRelationships).toHaveBeenCalledWith(
        resourceName,
        testRecords,
        options.expand,
      );

      // Verify the expanded result
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0]).toHaveProperty("profile");
      }
    });

    it("should handle query errors", async () => {
      // Setup mocks
      const testError = new Error("Query failed");
      mockStore.query.mockReturnValue(err(testError));

      // Create resource operations
      const resourceOps = createResourceOperations(
        resourceName,
        primaryKey,
        mockStore,
        mockPersistenceManager,
        mockRelationshipExpander,
      );

      // Call findAll
      const result = await resourceOps.findAll();

      // Verify the result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(testError);
      }
    });

    it("should handle exceptions", async () => {
      // Setup mocks
      mockStore.query.mockImplementation(() => {
        throw new Error("Test error");
      });

      // Create resource operations
      const resourceOps = createResourceOperations(
        resourceName,
        primaryKey,
        mockStore,
        mockPersistenceManager,
        mockRelationshipExpander,
      );

      // Call findAll
      const result = await resourceOps.findAll();

      // Verify the result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        // Just verify it's an error, not the exact message
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });

  describe("findById", () => {
    it("should return a record by ID when successful", async () => {
      // Setup mocks
      mockStore.getRecord.mockReturnValue(ok(testRecord));

      // Create resource operations
      const resourceOps = createResourceOperations(
        resourceName,
        primaryKey,
        mockStore,
        mockPersistenceManager,
        mockRelationshipExpander,
      );

      // Call findById
      const result = await resourceOps.findById(1);

      // Verify the result
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(testRecord);
      }

      // Verify that getRecord was called
      expect(mockStore.getRecord).toHaveBeenCalledWith(
        resourceName,
        1,
        primaryKey,
      );
    });
  });

  describe("create", () => {
    it("should create a record and save to file when successful", async () => {
      // Setup mocks
      mockStore.addRecord.mockReturnValue(ok(testRecord));
      mockPersistenceManager.saveToFile.mockResolvedValue(ok(undefined));

      // Create resource operations
      const resourceOps = createResourceOperations(
        resourceName,
        primaryKey,
        mockStore,
        mockPersistenceManager,
        mockRelationshipExpander,
      );

      // Call create
      const result = await resourceOps.create({ name: "Test User" });

      // Verify the result
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(testRecord);
      }

      // Verify that addRecord was called
      expect(mockStore.addRecord).toHaveBeenCalledWith(
        resourceName,
        { name: "Test User" },
        primaryKey,
      );

      // Verify that saveToFile was called
      expect(mockPersistenceManager.saveToFile).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete a record with cascade relationships", async () => {
      // Setup mocks
      mockStore.deleteRecord.mockReturnValue(ok(true));
      mockPersistenceManager.saveToFile.mockResolvedValue(ok(undefined));
      mockRelationshipExpander.getRelationships.mockReturnValue(
        ok([
          { type: "hasMany", resource: "posts", foreignKey: "userId" },
          { type: "hasOne", resource: "profile", foreignKey: "userId" },
          { type: "belongsTo", resource: "role", foreignKey: "roleId" }, // Should be ignored
        ]),
      );

      // Create resource operations
      const resourceOps = createResourceOperations(
        resourceName,
        primaryKey,
        mockStore,
        mockPersistenceManager,
        mockRelationshipExpander,
      );

      // Call delete
      const result = await resourceOps.delete(1);

      // Verify the result
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }

      // Verify that deleteRecord was called with the correct cascade relationships
      expect(mockStore.deleteRecord).toHaveBeenCalledWith(
        resourceName,
        1,
        primaryKey,
        [
          { collection: "posts", foreignKey: "userId" },
          { collection: "profile", foreignKey: "userId" },
        ],
      );

      // Verify that saveToFile was called
      expect(mockPersistenceManager.saveToFile).toHaveBeenCalled();
    });
  });
});
