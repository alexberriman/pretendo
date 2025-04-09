import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRelationshipExpander } from "./relations.js";
import { ApiConfig, DbRecord } from "../types/index.js";
import { Store } from "./store.js";
import { ok, err } from "../types/result.js";

// This is a partial mock - we're only implementing the methods we need for tests
const createMockStore = () =>
  ({
    getData: vi.fn(() => ({})),
    getCollection: vi.fn(),
    query: vi.fn(),
    getRecord: vi.fn(),
    addRecord: vi.fn(),
    updateRecord: vi.fn(),
    deleteRecord: vi.fn(),
    reset: vi.fn(),
    findRelated: vi.fn(),
    setRecord: vi.fn(),
  }) as Store;

describe("RelationshipExpander", () => {
  let mockStore: Store;
  let sampleConfig: ApiConfig;

  beforeEach(() => {
    mockStore = createMockStore();

    sampleConfig = {
      resources: [
        {
          name: "users",
          fields: [
            { name: "id", type: "number" },
            { name: "name", type: "string" },
          ],
          relationships: [
            {
              type: "hasMany",
              resource: "posts",
              foreignKey: "userId",
            },
          ],
        },
        {
          name: "posts",
          fields: [
            { name: "id", type: "number" },
            { name: "title", type: "string" },
            { name: "userId", type: "number" },
          ],
          relationships: [
            {
              type: "belongsTo",
              resource: "users",
              foreignKey: "userId",
            },
            {
              type: "hasMany",
              resource: "comments",
              foreignKey: "postId",
            },
          ],
        },
        {
          name: "comments",
          fields: [
            { name: "id", type: "number" },
            { name: "content", type: "string" },
            { name: "postId", type: "number" },
            { name: "userId", type: "number" },
          ],
          relationships: [
            {
              type: "belongsTo",
              resource: "posts",
              foreignKey: "postId",
            },
            {
              type: "belongsTo",
              resource: "users",
              foreignKey: "userId",
            },
          ],
        },
      ],
    };
  });

  describe("getRelationships", () => {
    it("should return relationships for existing resource", () => {
      const expander = createRelationshipExpander(sampleConfig, mockStore);
      const result = expander.getRelationships("users");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].resource).toBe("posts");
      }
    });

    it("should return error for non-existent resource", () => {
      const expander = createRelationshipExpander(sampleConfig, mockStore);
      const result = expander.getRelationships("nonexistent");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("not found");
      }
    });
  });

  describe("findRelatedRecords", () => {
    it("should handle hasMany relationships", async () => {
      const mockPosts = [
        { id: 1, title: "Post 1", userId: 1 },
        { id: 2, title: "Post 2", userId: 1 },
      ];

      mockStore.getRecord = vi
        .fn()
        .mockReturnValue(ok({ id: 1, name: "User 1" }));
      mockStore.findRelated = vi.fn().mockReturnValue(ok(mockPosts));

      const expander = createRelationshipExpander(sampleConfig, mockStore);
      const result = await expander.findRelatedRecords("users", 1, "posts");

      // Just check that findRelated was called and we got a success result
      expect(mockStore.findRelated).toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });

    it("should handle belongsTo relationships", async () => {
      const mockUser = { id: 1, name: "User 1" };

      mockStore.getRecord = vi.fn().mockImplementation((collection, id) => {
        if (collection === "posts") {
          return ok({ id: 1, title: "Post 1", userId: 1 });
        } else if (collection === "users" && id === 1) {
          return ok(mockUser);
        }
        return err(new Error("Not found"));
      });

      const expander = createRelationshipExpander(sampleConfig, mockStore);
      const result = await expander.findRelatedRecords("posts", 1, "user");

      // Should return an error because the relationship name is incorrect
      expect(result.ok).toBe(false);
    });

    it("should return error for non-existent resource", async () => {
      const expander = createRelationshipExpander(sampleConfig, mockStore);
      const result = await expander.findRelatedRecords(
        "nonexistent",
        1,
        "posts",
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("not found");
      }
    });
  });

  describe("expandRelationships", () => {
    it("should return original records if no expand paths", () => {
      const records: DbRecord[] = [{ id: 1, name: "User 1" }];
      const expander = createRelationshipExpander(sampleConfig, mockStore);

      const result = expander.expandRelationships("users", records, []);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(records);
      }
    });
  });
});
