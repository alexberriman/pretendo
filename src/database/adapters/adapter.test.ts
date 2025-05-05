import { describe, expect, it, beforeEach } from "vitest";
import { DbRecord } from "../../types/index.js";
import { MemoryAdapter } from "./memory-adapter.js";
import { JsonFileAdapter } from "./json-file-adapter.js";
import { createAdapter, validateAdapter } from "./factory.js";

// Mock fs module
vi.mock("fs/promises", () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue("{}"),
    access: vi.fn().mockRejectedValue({ code: "ENOENT" }),
    copyFile: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("DatabaseAdapter", () => {
  describe("MemoryAdapter", () => {
    let adapter: MemoryAdapter;

    beforeEach(() => {
      adapter = new MemoryAdapter();
    });

    it("should initialize correctly", async () => {
      const result = await adapter.initialize();
      expect(result.ok).toBe(true);
    });

    it("should create and retrieve resources", async () => {
      // Create a resource
      const createResult = await adapter.createResource("users", {
        name: "John Doe",
        email: "john@example.com",
      });

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const newUser = createResult.value;
        expect(newUser.id).toBeDefined();
        expect(newUser.name).toBe("John Doe");

        // Retrieve the resource
        const getResult = await adapter.getResource("users", newUser.id);
        expect(getResult.ok).toBe(true);
        if (getResult.ok) {
          const user = getResult.value;
          expect(user).toEqual(newUser);
        }
      }
    });

    it("should update resources", async () => {
      // Create a resource
      const createResult = await adapter.createResource("users", {
        name: "John Doe",
        email: "john@example.com",
      });

      if (createResult.ok) {
        const userId = createResult.value.id;

        // Update the resource
        const updateResult = await adapter.updateResource("users", userId, {
          id: userId,
          name: "Jane Doe",
          email: "jane@example.com",
        });

        expect(updateResult.ok).toBe(true);
        if (updateResult.ok) {
          const updatedUser = updateResult.value;
          expect(updatedUser?.name).toBe("Jane Doe");

          // Verify update
          const getResult = await adapter.getResource("users", userId);
          expect(getResult.ok).toBe(true);
          if (getResult.ok) {
            expect(getResult.value?.name).toBe("Jane Doe");
          }
        }
      }
    });

    it("should patch resources", async () => {
      // Create a resource
      const createResult = await adapter.createResource("users", {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      });

      if (createResult.ok) {
        const userId = createResult.value.id;

        // Patch the resource
        const patchResult = await adapter.patchResource("users", userId, {
          name: "Johnny Doe",
        });

        expect(patchResult.ok).toBe(true);
        if (patchResult.ok) {
          const patchedUser = patchResult.value;
          expect(patchedUser?.name).toBe("Johnny Doe");
          expect(patchedUser?.email).toBe("john@example.com"); // Unchanged
          expect(patchedUser?.age).toBe(30); // Unchanged
        }
      }
    });

    it("should delete resources", async () => {
      // Create a resource
      const createResult = await adapter.createResource("users", {
        name: "John Doe",
        email: "john@example.com",
      });

      if (createResult.ok) {
        const userId = createResult.value.id;

        // Delete the resource
        const deleteResult = await adapter.deleteResource("users", userId);
        expect(deleteResult.ok).toBe(true);
        if (deleteResult.ok) {
          expect(deleteResult.value).toBe(true);

          // Verify deletion
          const getResult = await adapter.getResource("users", userId);
          expect(getResult.ok).toBe(true);
          if (getResult.ok) {
            expect(getResult.value).toBeNull();
          }
        }
      }
    });

    it("should handle related resources", async () => {
      // Create a user
      const userResult = await adapter.createResource("users", {
        name: "John Doe",
      });

      if (userResult.ok) {
        const userId = userResult.value.id;

        // Create some posts for the user
        await adapter.createResource("posts", {
          title: "Post 1",
          userId,
        });

        await adapter.createResource("posts", {
          title: "Post 2",
          userId,
        });

        // Create a post for another user
        await adapter.createResource("posts", {
          title: "Another post",
          userId: 999,
        });

        // Find related posts
        const relatedResult = await adapter.findRelated(
          "users",
          userId,
          "posts",
        );
        expect(relatedResult.ok).toBe(true);
        if (relatedResult.ok) {
          const posts = relatedResult.value;
          expect(posts.length).toBe(2);
          expect(posts[0].title).toBe("Post 1");
          expect(posts[1].title).toBe("Post 2");
        }
      }
    });

    it("should create and restore backups", async () => {
      // Add some data
      await adapter.createResource("users", { name: "User 1" });
      await adapter.createResource("users", { name: "User 2" });

      // Create backup
      const backupResult = await adapter.backup("test-backup");
      expect(backupResult.ok).toBe(true);

      // Add more data
      await adapter.createResource("users", { name: "User 3" });

      // Check current data
      const beforeRestore = await adapter.getResources("users");
      expect(beforeRestore.ok).toBe(true);
      if (beforeRestore.ok) {
        expect(beforeRestore.value.length).toBe(3);
      }

      // Restore backup
      const restoreResult = await adapter.restore("test-backup");
      expect(restoreResult.ok).toBe(true);

      // Check restored data
      const afterRestore = await adapter.getResources("users");
      expect(afterRestore.ok).toBe(true);
      if (afterRestore.ok) {
        expect(afterRestore.value.length).toBe(2);
      }
    });

    it("should reset the database", async () => {
      // Add some data
      await adapter.createResource("users", { name: "User 1" });
      await adapter.createResource("posts", { title: "Post 1" });

      // Reset
      const resetResult = await adapter.reset();
      expect(resetResult.ok).toBe(true);

      // Check if empty
      const usersResult = await adapter.getResources("users");
      expect(usersResult.ok).toBe(true);
      if (usersResult.ok) {
        expect(usersResult.value.length).toBe(0);
      }

      const postsResult = await adapter.getResources("posts");
      expect(postsResult.ok).toBe(true);
      if (postsResult.ok) {
        expect(postsResult.value.length).toBe(0);
      }
    });

    it("should provide database stats", async () => {
      // Add some data
      await adapter.createResource("users", { name: "User 1" });
      await adapter.createResource("users", { name: "User 2" });
      await adapter.createResource("posts", { title: "Post 1" });

      // Get stats
      const stats = adapter.getStats();

      // Verify stats
      expect(stats.users.count).toBe(2);
      expect(stats.posts.count).toBe(1);
      expect(stats.users.lastModified).toBeGreaterThan(0);
    });
  });

  describe("Adapter Factory", () => {
    it("should create a json-file adapter", () => {
      const result = createAdapter("json-file");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeInstanceOf(JsonFileAdapter);
      }
    });

    it("should create a memory adapter", () => {
      const result = createAdapter("memory");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeInstanceOf(MemoryAdapter);
      }
    });

    it("should reject invalid adapter types", () => {
      const result = createAdapter("invalid-type" as any);
      expect(result.ok).toBe(false);
    });

    it("should validate a custom adapter", () => {
      // Create a mock adapter that implements all required methods
      const customAdapter = {
        initialize: async () => ok(undefined),
        getResources: async () => ok([]),
        getResource: async () => ok(null),
        createResource: async () => ok({} as DbRecord),
        updateResource: async () => ok({} as DbRecord),
        patchResource: async () => ok({} as DbRecord),
        deleteResource: async () => ok(true),
        findRelated: async () => ok([]),
        backup: async () => ok("backup-id"),
        restore: async () => ok(undefined),
        reset: async () => ok(undefined),
        getStats: () => ({}),
      };

      const result = validateAdapter(customAdapter);
      expect(result.ok).toBe(true);
    });

    it("should reject an invalid adapter", () => {
      const invalidAdapter = {};
      const result = validateAdapter(invalidAdapter);
      expect(result.ok).toBe(false);
    });
  });
});
