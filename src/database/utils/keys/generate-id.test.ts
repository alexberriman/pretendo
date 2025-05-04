import { describe, it, expect } from "vitest";
import { generateId } from "./generate-id.js";
import { DbRecord } from "../../../types/index.js";

describe("generateId", () => {
  it("should return 1 for an empty collection", () => {
    expect(generateId([])).toBe(1);
  });

  it("should return 1 when collection is null or undefined", () => {
    expect(generateId(null as unknown as DbRecord[])).toBe(1);
    expect(generateId(undefined as unknown as DbRecord[])).toBe(1);
  });

  it("should return max id + 1 for a collection with numeric ids", () => {
    const records: DbRecord[] = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
      { id: 5, name: "Item 5" },
    ];

    expect(generateId(records)).toBe(6);
  });

  it("should use the specified primary key", () => {
    const records: DbRecord[] = [
      { userId: 10, name: "User 1" },
      { userId: 20, name: "User 2" },
      { userId: 30, name: "User 3" },
    ];

    expect(generateId(records, "userId")).toBe(31);
  });

  it("should ignore non-numeric IDs", () => {
    const records: DbRecord[] = [
      { id: 1, name: "Item 1" },
      { id: "ABC", name: "Item ABC" },
      { id: 5, name: "Item 5" },
      { id: "10", name: "Item 10" },
    ];

    expect(generateId(records)).toBe(6);
  });

  it("should handle mixed string and number IDs correctly", () => {
    const records: DbRecord[] = [
      { id: "1", name: "Item 1" },
      { id: 2, name: "Item 2" },
      { id: "three", name: "Item 3" },
    ];

    expect(generateId(records)).toBe(3);
  });

  it("should return 1 if no numeric IDs are found", () => {
    const records: DbRecord[] = [
      { id: "A", name: "Item A" },
      { id: "B", name: "Item B" },
      { id: "C", name: "Item C" },
    ];

    expect(generateId(records)).toBe(1);
  });

  it("should handle missing primary key in some records", () => {
    const records: DbRecord[] = [
      { id: 1, name: "Item 1" },
      { name: "Item without ID" },
      { id: 3, name: "Item 3" },
    ];

    expect(generateId(records)).toBe(4);
  });

  it("should handle 0 as a valid ID value", () => {
    const records: DbRecord[] = [
      { id: 0, name: "Item 0" },
      { id: 1, name: "Item 1" },
    ];

    expect(generateId(records)).toBe(2);
  });

  it("should handle negative IDs correctly", () => {
    const records: DbRecord[] = [
      { id: -5, name: "Item -5" },
      { id: -10, name: "Item -10" },
      { id: 3, name: "Item 3" },
    ];

    expect(generateId(records)).toBe(4);
  });
});
