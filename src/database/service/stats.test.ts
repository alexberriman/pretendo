import { describe, it, expect, vi, beforeEach } from "vitest";
import { getStats } from "./stats.js";
import { ApiConfig, DbRecord } from "../../types/index.js";
import { Store } from "../../types/index.js";
import { ok } from "../../types/index.js";

describe("getStats", () => {
  // Mock dependencies
  const mockStore = {
    getData: vi.fn(),
  } as unknown as Store;

  // Test data
  const testConfig: ApiConfig = {
    resources: [{ name: "users" }, { name: "posts" }, { name: "empty" }],
  } as unknown as ApiConfig;

  const usersData: DbRecord[] = [
    { id: 1, name: "User 1" },
    { id: 2, name: "User 2" },
    { id: 3, name: "User 3" },
  ];

  const postsData: DbRecord[] = [
    { id: 1, title: "Post 1" },
    { id: 2, title: "Post 2" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Date.now mock to avoid timing issues
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 0, 1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return statistics for all resources", () => {
    // Setup mocks
    mockStore.getData.mockImplementation((collectionName: string) => {
      if (collectionName === "users") {
        return ok(usersData);
      } else if (collectionName === "posts") {
        return ok(postsData);
      } else {
        return ok([]);
      }
    });

    // Call getStats
    const stats = getStats(testConfig, mockStore);

    // Verify the result
    expect(stats).toEqual({
      users: {
        count: 3,
        lastModified: Date.now(),
      },
      posts: {
        count: 2,
        lastModified: Date.now(),
      },
      empty: {
        count: 0,
        lastModified: Date.now(),
      },
    });

    // Verify that getData was called for each resource
    expect(mockStore.getData).toHaveBeenCalledTimes(3);
    expect(mockStore.getData).toHaveBeenCalledWith("users");
    expect(mockStore.getData).toHaveBeenCalledWith("posts");
    expect(mockStore.getData).toHaveBeenCalledWith("empty");
  });

  it("should handle non-Result data returned from getData", () => {
    // Setup mocks
    mockStore.getData.mockImplementation((collectionName: string) => {
      // Return an array directly instead of a Result for one resource
      if (collectionName === "users") {
        return usersData;
      } else {
        return ok([]);
      }
    });

    // Call getStats
    const stats = getStats(testConfig, mockStore);

    // Verify the result - should have zero for non-Result resource
    expect(stats).toEqual({
      users: {
        count: 0,
        lastModified: Date.now(),
      },
      posts: {
        count: 0,
        lastModified: Date.now(),
      },
      empty: {
        count: 0,
        lastModified: Date.now(),
      },
    });
  });
});
