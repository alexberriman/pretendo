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
import { ApiConfig, Result, Server, ok, err } from "./types/index.js";
import { parseFromObject } from "./config/index.js";
import { createDatabaseService } from "./database/index.js";
import { createServer } from "./server/index.js";

/**
 * Create and start a mock API server from a configuration object
 *
 * @param config - The API configuration object or path to config file
 * @param port - Optional port to run the server on
 * @returns A Result containing the server object or an error
 */
export const createMockApi = async (
  config: ApiConfig,
  port?: number,
): Promise<Result<Server, Error>> => {
  try {
    // Validate config
    const configResult = parseFromObject(config);
    if (!configResult.ok) {
      return configResult;
    }

    const validConfig = configResult.value;

    // Create database service
    const database = createDatabaseService(validConfig);

    // Initialize database
    const initResult = await database.initialize(validConfig);
    if (!initResult.ok) {
      return err(initResult.error);
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
};
