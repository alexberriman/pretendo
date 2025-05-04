import { describe, it, expect } from "vitest";
import { getResourcePrimaryKey } from "./resource-key.js";
import { ApiConfig } from "../../types/index.js";

describe("getResourcePrimaryKey", () => {
  // Test data
  const testConfig: ApiConfig = {
    resources: [
      { name: "users", primaryKey: "userId" },
      { name: "posts", fields: [] }, // No custom primary key, should use default "id"
      { name: "categories", primaryKey: "categoryId" },
    ],
  } as unknown as ApiConfig;

  it("should return the custom primary key if specified", () => {
    const result = getResourcePrimaryKey("users", testConfig);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("userId");
    }
  });

  it("should return the default primary key if not specified", () => {
    const result = getResourcePrimaryKey("posts", testConfig);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("id");
    }
  });

  it("should return an error if resource does not exist", () => {
    const result = getResourcePrimaryKey("nonExistent", testConfig);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Resource 'nonExistent' not found");
    }
  });
});
