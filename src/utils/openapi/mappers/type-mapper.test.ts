import { describe, it, expect } from "vitest";
import { mapTypeToOpenApiType } from "./type-mapper.js";

describe("type-mapper", () => {
  describe("mapTypeToOpenApiType", () => {
    it("should correctly map string type", () => {
      const result = mapTypeToOpenApiType("string");
      expect(result).toEqual({ type: "string" });
    });

    it("should correctly map number type", () => {
      const result = mapTypeToOpenApiType("number");
      expect(result).toEqual({ type: "number" });
    });

    it("should correctly map boolean type", () => {
      const result = mapTypeToOpenApiType("boolean");
      expect(result).toEqual({ type: "boolean" });
    });

    it("should correctly map array type", () => {
      const result = mapTypeToOpenApiType("array");
      expect(result).toEqual({ type: "array", format: "json" });
    });

    it("should correctly map object type", () => {
      const result = mapTypeToOpenApiType("object");
      expect(result).toEqual({ type: "object", format: "json" });
    });

    it("should correctly map date type", () => {
      const result = mapTypeToOpenApiType("date");
      expect(result).toEqual({ type: "string", format: "date-time" });
    });

    it("should correctly map uuid type", () => {
      const result = mapTypeToOpenApiType("uuid");
      expect(result).toEqual({ type: "string", format: "uuid" });
    });

    it("should default to string for unknown types", () => {
      // @ts-expect-error Testing with invalid type
      const result = mapTypeToOpenApiType("unknown");
      expect(result).toEqual({ type: "string" });
    });
  });
});
