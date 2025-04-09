import { describe, it, expect, vi } from "vitest";
import {
  ok,
  err,
  mapResult,
  flatMapResult,
  getOrElse,
  getOrThrow,
  mapError,
  toPromise,
} from "./result.js";

describe("Result", () => {
  describe("ok", () => {
    it("should create a successful result", () => {
      const result = ok(42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });
  });

  describe("err", () => {
    it("should create a failure result", () => {
      const error = new Error("Something went wrong");
      const result = err(error);
      expect(result.ok).toBe(false);
      expect(result.error).toBe(error);
    });
  });

  describe("mapResult", () => {
    it("should transform the value of a successful result", () => {
      const result = ok(5);
      const mapped = mapResult(result, (x: number) => x * 2);
      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(10);
      }
    });

    it("should pass through failure results unchanged", () => {
      const error = new Error("fail");
      const result = err(error);
      const mapped = mapResult(result, (x: number) => x * 2);
      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toBe(error);
      }
    });
  });

  describe("flatMapResult", () => {
    it("should chain successful results", () => {
      const result = ok(5);
      const chained = flatMapResult(result, (x) => ok(x * 2));
      expect(chained.ok).toBe(true);
      if (chained.ok) {
        expect(chained.value).toBe(10);
      }
    });

    it("should propagate failures in the chain", () => {
      const result = ok(5);
      const error = new Error("inner error");
      const chained = flatMapResult(result, (_) => err(error));
      expect(chained.ok).toBe(false);
      if (!chained.ok) {
        expect(chained.error).toBe(error);
      }
    });

    it("should not call the function for failure results", () => {
      const error = new Error("initial error");
      const result = err(error);
      const fn = vi.fn();
      const chained = flatMapResult(result, fn);
      expect(fn).not.toHaveBeenCalled();
      expect(chained.ok).toBe(false);
      if (!chained.ok) {
        expect(chained.error).toBe(error);
      }
    });
  });

  describe("getOrElse", () => {
    it("should return the value for successful results", () => {
      const result = ok(42);
      expect(getOrElse(result, 0)).toBe(42);
    });

    it("should return the default value for failure results", () => {
      const result = err(new Error());
      expect(getOrElse(result, 0)).toBe(0);
    });
  });

  describe("getOrThrow", () => {
    it("should return the value for successful results", () => {
      const result = ok(42);
      expect(getOrThrow(result)).toBe(42);
    });

    it("should throw the error for failure results", () => {
      const error = new Error("test error");
      const result = err(error);
      expect(() => getOrThrow(result)).toThrow(error);
    });
  });

  describe("mapError", () => {
    it("should transform the error of a failure result", () => {
      const result = err(new Error("original"));
      const mapped = mapError(result, (e) => new TypeError(e.message));
      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toBeInstanceOf(TypeError);
      }
    });

    it("should pass through success results unchanged", () => {
      const result = ok(42);
      const mapped = mapError(result, (e) => {
        if (e instanceof Error) {
          return new TypeError(e.message);
        }
        return new TypeError("Unknown error");
      });
      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(42);
      }
    });
  });

  describe("toPromise", () => {
    it("should convert a successful result to a resolved promise", async () => {
      const result = ok(42);
      await expect(toPromise(result)).resolves.toBe(42);
    });

    it("should convert a failure result to a rejected promise", async () => {
      const error = new Error("test error");
      const result = err(error);
      await expect(toPromise(result)).rejects.toBe(error);
    });
  });
});
