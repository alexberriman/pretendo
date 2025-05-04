import { describe, it, expect } from "vitest";
import { resetStore } from "./reset-store.js";
import { DbRecord } from "../../../types/index.js";

describe("resetStore", () => {
  it("should return a successful Result", () => {
    const newData: Record<string, DbRecord[]> = {
      users: [
        { id: 1, name: "John" },
        { id: 2, name: "Jane" },
      ],
    };

    const result = resetStore(newData);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBeUndefined();
    }
  });
});
