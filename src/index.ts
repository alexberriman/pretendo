// Export public API
export * from "./types/index.js";
export { createDatabaseService } from "./database/index.js";
export { createServer } from "./server/index.js";
export {
  parseFromObject,
  parseFromString,
  parseFromYaml,
} from "./config/index.js";
export { exampleConfig } from "./config/schema.js";

// Re-export useful types
export type {
  ApiConfig,
  ApiOptions,
  Resource,
  ResourceField,
  Relationship,
  DatabaseService,
  Server,
  Result,
} from "./types/index.js";
export { ok, err } from "./types/index.js";

// Main API function
import {
  ApiConfig,
  Result,
  Server,
  ok,
  err,
  DatabaseService,
} from "./types/index.js";
import { parseFromObject } from "./config/index.js";
import { createDatabaseService } from "./database/index.js";
import { createServer } from "./server/index.js";

/**
 * Options for creating a mock API
 */
export interface CreateMockApiOptions {
  /**
   * The API specification/configuration (what would be read from a .yml file)
   */
  spec: ApiConfig;

  /**
   * Optional custom database adapter to use with the API
   * If not provided, one will be created based on the spec configuration
   */
  database?: DatabaseService;

  /**
   * Optional port to run the server on
   */
  port?: number;
}

/**
 * Create and start a mock API server
 * @param options - Configuration options for the mock API
 * @returns A Result containing the server object or an error
 */
export async function createMockApi(
  options: CreateMockApiOptions,
): Promise<Result<Server, Error>> {
  try {
    const { spec, database: customDatabase, port } = options;

    // Validate config
    const configResult = parseFromObject(spec);
    if (!configResult.ok) {
      return configResult;
    }

    const validConfig = configResult.value;

    // Use provided database or create a new one
    const database = customDatabase || createDatabaseService(validConfig);

    // Initialize database (skip if custom database was provided)
    if (!customDatabase) {
      const initResult = await database.initialize(validConfig);
      if (!initResult.ok) {
        return err(initResult.error);
      }
    }

    // Create server
    const server = createServer(validConfig, database);

    // Start server
    const startResult = await server.start(port);
    if (!startResult.ok) {
      return err(startResult.error);
    }

    return ok(server);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error(`Failed to create mock API: ${String(error)}`),
    );
  }
}
