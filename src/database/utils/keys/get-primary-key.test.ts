import { describe, it, expect } from "vitest";
import { getPrimaryKey } from "./get-primary-key.js";
import { ApiConfig } from "../../../types/index.js";

describe("getPrimaryKey", () => {
  const mockApiConfig: Pick<ApiConfig, "resources"> = {
    resources: [
      {
        name: "users",
        primaryKey: "userId",
      },
      {
        name: "products",
        // No primaryKey specified, should default to 'id'
      },
      {
        name: "orders",
        primaryKey: "orderId",
      },
    ],
  };

  it("should return the specified primaryKey for a collection", () => {
    expect(getPrimaryKey("users", mockApiConfig)).toBe("userId");
    expect(getPrimaryKey("orders", mockApiConfig)).toBe("orderId");
  });

  it('should return "id" as the default when no primaryKey is specified', () => {
    expect(getPrimaryKey("products", mockApiConfig)).toBe("id");
  });

  it('should return "id" for non-existent collections', () => {
    expect(getPrimaryKey("nonExistent", mockApiConfig)).toBe("id");
  });

  it("should handle case-sensitive collection names", () => {
    // Collection names should be case-sensitive
    expect(getPrimaryKey("Users", mockApiConfig)).toBe("id");
    expect(getPrimaryKey("PRODUCTS", mockApiConfig)).toBe("id");
  });

  it("should handle empty resources array", () => {
    const emptyConfig: Pick<ApiConfig, "resources"> = {
      resources: [],
    };

    expect(getPrimaryKey("anything", emptyConfig)).toBe("id");
  });
});
