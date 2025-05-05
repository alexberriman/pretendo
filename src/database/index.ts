import {
  ApiConfig,
  DatabaseService,
  DbRecord,
  ReadonlyDeep,
  err,
  ok,
} from "../types/index.js";
import { ResourceField } from "../types/config.js";

// Import database adapters system
import {
  DatabaseAdapter,
  DatabaseAdapterOptions,
  createAdapter,
  createAdapterResourceOperations,
} from "./adapters/index.js";

// Import resource config modules
import { getResourceConfig } from "./service/index.js";

export const createDatabaseService = (
  initialConfig: ReadonlyDeep<ApiConfig>,
): DatabaseService => {
  // Clone and cast to bypass readonly constraints
  const mutableConfig = JSON.parse(JSON.stringify(initialConfig)) as ApiConfig;

  // Get database configuration
  const dbConfig = initialConfig.options?.database || {};

  // Set up adapter options, supporting both new and legacy configuration
  const adapterOptions: DatabaseAdapterOptions = {
    dbPath: dbConfig.dbPath || initialConfig.options?.dbPath || "./db.json",
    autoSave: dbConfig.autoSave !== undefined ? dbConfig.autoSave : true,
    saveInterval:
      dbConfig.saveInterval !== undefined ? dbConfig.saveInterval : 5000,
    ...dbConfig, // Include any custom adapter options
  };

  // Create adapter or use provided custom adapter
  const adapterType = (dbConfig.adapter as string) || "json-file";

  // Create the database adapter
  const adapterResult = createAdapter(adapterType, adapterOptions);

  if (!adapterResult.ok) {
    throw adapterResult.error;
  }

  // Store the adapter instance
  let dbAdapter: DatabaseAdapter = adapterResult.value;

  // Get resource fields from the configuration
  const resourceFields: Record<string, ResourceField[]> = {};
  if (initialConfig.resources && Array.isArray(initialConfig.resources)) {
    for (const resource of initialConfig.resources) {
      if (resource.fields && Array.isArray(resource.fields)) {
        resourceFields[resource.name] = resource.fields;
      }
    }
  }

  // Set strictValidation option
  const strictValidation = initialConfig.options?.strictValidation === true;

  // Pass strictValidation to adapter options
  if (strictValidation) {
    adapterOptions.strictValidation = true;
  }

  // Initialize the adapter with initial data and resource fields
  (async () => {
    await dbAdapter.initialize(
      initialConfig.data as Record<string, DbRecord[]>,
      resourceFields,
    );
  })();

  // Setter function to allow updating adapter instance
  const setAdapter = (newAdapter: DatabaseAdapter) => {
    dbAdapter = newAdapter;
  };

  return {
    initialize: async (config: ReadonlyDeep<ApiConfig>) => {
      try {
        // Get updated configuration
        const newConfig = JSON.parse(JSON.stringify(config)) as ApiConfig;
        const newDbConfig = newConfig.options?.database || {};

        // Set up new adapter options
        const newAdapterOptions: DatabaseAdapterOptions = {
          dbPath:
            newDbConfig.dbPath || newConfig.options?.dbPath || "./db.json",
          autoSave:
            newDbConfig.autoSave !== undefined ? newDbConfig.autoSave : true,
          saveInterval:
            newDbConfig.saveInterval !== undefined
              ? newDbConfig.saveInterval
              : 5000,
          ...newDbConfig,
        };

        // Create new adapter or use provided custom adapter
        const newAdapterType = (newDbConfig.adapter as string) || "json-file";
        const newAdapterResult = createAdapter(
          newAdapterType,
          newAdapterOptions,
        );

        if (!newAdapterResult.ok) {
          return err(newAdapterResult.error);
        }

        // Update the adapter
        setAdapter(newAdapterResult.value);

        // Get resource fields from the new configuration
        const newResourceFields: Record<string, ResourceField[]> = {};
        if (newConfig.resources && Array.isArray(newConfig.resources)) {
          for (const resource of newConfig.resources) {
            if (resource.fields && Array.isArray(resource.fields)) {
              newResourceFields[resource.name] = resource.fields;
            }
          }
        }

        // Set strictValidation option
        const newStrictValidation =
          newConfig.options?.strictValidation === true;

        // Pass strictValidation to adapter options
        if (newStrictValidation) {
          newAdapterOptions.strictValidation = true;
        }

        // Initialize the new adapter with initial data and resource fields
        const initResult = await dbAdapter.initialize(
          newConfig.data as Record<string, DbRecord[]>,
          newResourceFields,
        );
        if (!initResult.ok) {
          return err(initResult.error);
        }

        return ok(undefined);
      } catch (error) {
        return err(
          error instanceof Error
            ? error
            : new Error(
                `Failed to initialize database service: ${String(error)}`,
              ),
        );
      }
    },

    getResource: (resourceName: string) => {
      try {
        // Check if resource exists in config
        const resourceConfigResult = getResourceConfig(
          resourceName,
          mutableConfig,
        );
        if (!resourceConfigResult.ok) {
          return err(resourceConfigResult.error);
        }

        // Create resource operations using the adapter
        const resourceOps = createAdapterResourceOperations(
          resourceName,
          dbAdapter,
        );

        return ok(resourceOps);
      } catch (error) {
        return err(
          error instanceof Error
            ? error
            : new Error(`Failed to get resource: ${String(error)}`),
        );
      }
    },

    getResourceConfig: (resourceName: string) => {
      return getResourceConfig(resourceName, mutableConfig);
    },

    reset: async () => {
      return await dbAdapter.reset();
    },

    backup: async (path?: string) => {
      return await dbAdapter.backup(path);
    },

    restore: async (path: string) => {
      return await dbAdapter.restore(path);
    },

    getStats: () => {
      return dbAdapter.getStats();
    },
  };
};
