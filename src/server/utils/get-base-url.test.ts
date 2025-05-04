import { describe, it, expect } from "vitest";
import { getBaseUrl } from "./get-base-url.js";
import { Request } from "express";

describe("getBaseUrl", () => {
  it("should construct correct URL with all components", () => {
    const mockRequest = {
      protocol: "https",
      headers: {
        host: "api.example.com",
      },
      baseUrl: "/api/v1",
      path: "/resources",
    } as Request;

    const result = getBaseUrl(mockRequest);
    expect(result).toBe("https://api.example.com/api/v1/resources");
  });

  it("should use 'localhost' as default host when not provided", () => {
    const mockRequest = {
      protocol: "http",
      headers: {},
      baseUrl: "/api",
      path: "/items",
    } as Request;

    const result = getBaseUrl(mockRequest);
    expect(result).toBe("http://localhost/api/items");
  });

  it("should handle empty baseUrl and path", () => {
    const mockRequest = {
      protocol: "https",
      headers: {
        host: "api.example.com",
      },
      baseUrl: "",
      path: "",
    } as Request;

    const result = getBaseUrl(mockRequest);
    expect(result).toBe("https://api.example.com");
  });

  it("should handle port numbers in host", () => {
    const mockRequest = {
      protocol: "http",
      headers: {
        host: "localhost:3000",
      },
      baseUrl: "/api",
      path: "/users",
    } as Request;

    const result = getBaseUrl(mockRequest);
    expect(result).toBe("http://localhost:3000/api/users");
  });

  it("should combine path segments correctly", () => {
    const mockRequest = {
      protocol: "https",
      headers: {
        host: "api.example.com",
      },
      baseUrl: "/api/v1/",
      path: "/resources",
    } as Request;

    const result = getBaseUrl(mockRequest);
    expect(result).toBe("https://api.example.com/api/v1//resources");
  });
});
