import { Result, err, ok } from "../../types/index.js";
import { DatabaseAdapter, DatabaseAdapterOptions } from "./adapter.js";
import { JsonFileAdapter } from "./json-file-adapter.js";
import { MemoryAdapter } from "./memory-adapter.js";

// Define valid adapter types
export type AdapterType = "json-file" | "memory" | string;

/**
 * Create a database adapter based on the specified type
 * @param type The type of adapter to create
 * @param options Configuration options for the adapter
 * @returns A Result containing the created adapter or an error
 */
export const createAdapter = (
  type: AdapterType = "json-file",
  options: DatabaseAdapterOptions = {},
): Result<DatabaseAdapter, Error> => {
  try {
    switch (type) {
      case "json-file":
        return ok(new JsonFileAdapter(options));

      case "memory":
        return ok(new MemoryAdapter(options));

      default:
        // If the adapter is a custom instance provided directly
        if (typeof type === "object" && type !== null) {
          const customAdapter = type as unknown as DatabaseAdapter;

          // Validate the adapter implements the required interface
          const requiredMethods = [
            "initialize",
            "getResources",
            "getResource",
            "createResource",
            "updateResource",
            "patchResource",
            "deleteResource",
            "findRelated",
            "backup",
            "restore",
            "reset",
            "getStats",
          ];

          const missingMethods = requiredMethods.filter(
            (method) =>
              !Object.prototype.hasOwnProperty.call(customAdapter, method),
          );

          if (missingMethods.length > 0) {
            return err(
              new Error(
                `Invalid custom adapter: missing required methods: ${missingMethods.join(
                  ", ",
                )}`,
              ),
            );
          }

          return ok(customAdapter);
        }

        return err(new Error(`Unknown adapter type: ${String(type)}`));
    }
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error(`Failed to create adapter: ${String(error)}`),
    );
  }
};

/**
 * Validate that an object is a proper database adapter
 * @param adapter The adapter to validate
 * @returns A Result indicating if the adapter is valid
 */
export const validateAdapter = (
  adapter: unknown,
): Result<DatabaseAdapter, Error> => {
  if (!adapter) {
    return err(new Error("Adapter cannot be null or undefined"));
  }

  if (typeof adapter !== "object") {
    return err(new Error("Adapter must be an object"));
  }

  const requiredMethods = [
    "initialize",
    "getResources",
    "getResource",
    "createResource",
    "updateResource",
    "patchResource",
    "deleteResource",
    "findRelated",
    "backup",
    "restore",
    "reset",
    "getStats",
  ];

  const adapterObj = adapter as Record<string, unknown>;

  const missingMethods = requiredMethods.filter(
    (method) =>
      !Object.prototype.hasOwnProperty.call(adapterObj, method) ||
      typeof adapterObj[method] !== "function",
  );

  if (missingMethods.length > 0) {
    return err(
      new Error(
        `Invalid adapter: missing required methods: ${missingMethods.join(", ")}`,
      ),
    );
  }

  return ok(adapter as DatabaseAdapter);
};
