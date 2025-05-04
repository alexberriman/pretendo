import { describe, it, expect, vi } from "vitest";
import { isUserResourceOwner } from "./is-user-resource-owner.js";

// Mock the logger to avoid log outputs in tests
vi.mock("../../utils/debug-logger.js", () => ({
  logger: {
    info: vi.fn(),
  },
}));

describe("isUserResourceOwner", () => {
  it("should return false if recordOwnerId is undefined", () => {
    expect(isUserResourceOwner(undefined, "123")).toBe(false);
  });

  it("should return false if recordOwnerId is null", () => {
    expect(isUserResourceOwner(null, "123")).toBe(false);
  });

  it("should return false if userId is undefined", () => {
    expect(isUserResourceOwner("123", undefined)).toBe(false);
  });

  it("should return false if userId is null", () => {
    expect(isUserResourceOwner("123", null)).toBe(false);
  });

  it("should return true for matching string IDs", () => {
    expect(isUserResourceOwner("abc123", "abc123")).toBe(true);
  });

  it("should return true for matching numeric IDs", () => {
    expect(isUserResourceOwner(123, 123)).toBe(true);
  });

  it("should return true for matching IDs of different types (string and number)", () => {
    expect(isUserResourceOwner("123", 123)).toBe(true);
    expect(isUserResourceOwner(123, "123")).toBe(true);
  });

  it("should trim whitespace in string comparisons", () => {
    expect(isUserResourceOwner(" 123 ", "123")).toBe(true);
    expect(isUserResourceOwner("123", " 123 ")).toBe(true);
  });

  it("should return false for non-matching IDs", () => {
    expect(isUserResourceOwner("123", "456")).toBe(false);
    expect(isUserResourceOwner(123, 456)).toBe(false);
    expect(isUserResourceOwner("abc", "def")).toBe(false);
  });

  it("should handle complex cases correctly", () => {
    expect(isUserResourceOwner("123.0", 123)).toBe(true);
    expect(isUserResourceOwner(123.0, "123")).toBe(true);
    expect(isUserResourceOwner("123abc", 123)).toBe(false);
  });

  it("should properly handle numeric-like strings", () => {
    expect(isUserResourceOwner("123", "123.0")).toBe(true);
    expect(isUserResourceOwner("-123", -123)).toBe(true);
    expect(isUserResourceOwner("+123", 123)).toBe(true);
    expect(isUserResourceOwner("123abc", "123")).toBe(false);
    expect(isUserResourceOwner("abc123", 123)).toBe(false);
  });
});
