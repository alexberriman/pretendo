import {
  ApiConfig,
  DatabaseService,
  DbRecord,
  QueryOptions,
  ReadonlyDeep,
  ResourceOperation,
  Result,
  err,
  flatMapResult,
  ok,
} from "../types/index.js";

// Import but rename to avoid unused variable warning
const _flatMapResult = flatMapResult;
import { createStore } from "./store.js";
import { createPersistenceManager } from "./persistence.js";
import { createRelationshipExpander } from "./relations.js";

export const createDatabaseService = (
  initialConfig: ReadonlyDeep<ApiConfig>,
): DatabaseService => {
  // The store and related services will be initialized in the initialize method
  // Clone and cast to bypass readonly constraints
  const mutableConfig = JSON.parse(JSON.stringify(initialConfig)) as ApiConfig;
  let store = createStore(mutableConfig);
  let persistenceManager = createPersistenceManager(store, {
    dbPath: initialConfig.options?.dbPath || "./db.json",
  });
  let relationshipExpander = createRelationshipExpander(mutableConfig, store);

  const initialize = async (
    config: ReadonlyDeep<ApiConfig>,
  ): Promise<Result<void, Error>> => {
    try {
      // Clone and cast to bypass readonly constraints
      const mutableConfig = JSON.parse(JSON.stringify(config)) as ApiConfig;
      // Create new instances with the provided config
      store = createStore(mutableConfig);
      persistenceManager = createPersistenceManager(store, {
        dbPath: config.options?.dbPath || "./db.json",
      });
      relationshipExpander = createRelationshipExpander(mutableConfig, store);

      // Try to load data from file if it exists
      const loadResult = await persistenceManager.loadFromFile();
      if (!loadResult.ok) {
        // If loading fails, save the initial data
        return await persistenceManager.saveToFile();
      }

      return ok(undefined);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to initialize database: ${String(error)}`),
      );
    }
  };

  const getResourcePrimaryKey = (
    resourceName: string,
  ): Result<string, Error> => {
    const resource = initialConfig.resources.find(
      (r) => r.name === resourceName,
    );
    if (!resource) {
      return err(new Error(`Resource '${resourceName}' not found`));
    }
    return ok(resource.primaryKey || "id");
  };

  const getResource = (
    resourceName: string,
  ): Result<ResourceOperation, Error> => {
    // Verify the resource exists
    const keyResult = getResourcePrimaryKey(resourceName);
    if (!keyResult.ok) {
      return err(keyResult.error);
    }

    const primaryKey = keyResult.value;

    const resourceOps: ResourceOperation = {
      findAll: async (options?: QueryOptions) => {
        try {
          let result = store.query(resourceName, options);

          if (!result.ok) {
            return result;
          }

          // Handle relationship expansion if requested
          if (options?.expand && options.expand.length > 0) {
            result = relationshipExpander.expandRelationships(
              resourceName,
              result.value,
              options.expand,
            );
          }

          return result;
        } catch (error) {
          return err(
            error instanceof Error
              ? error
              : new Error(`Failed to find records: ${String(error)}`),
          );
        }
      },

      findById: async (id: string | number) => {
        try {
          return store.getRecord(resourceName, id, primaryKey);
        } catch (error) {
          return err(
            error instanceof Error
              ? error
              : new Error(`Failed to find record: ${String(error)}`),
          );
        }
      },

      create: async (data: Omit<DbRecord, "id">) => {
        try {
          const result = store.addRecord(
            resourceName,
            data as DbRecord,
            primaryKey,
          );

          if (result.ok) {
            // Save changes to file
            await persistenceManager.saveToFile();
          }

          return result;
        } catch (error) {
          return err(
            error instanceof Error
              ? error
              : new Error(`Failed to create record: ${String(error)}`),
          );
        }
      },

      update: async (id: string | number, data: Partial<DbRecord>) => {
        try {
          // Do a full replace, not a merge
          const result = store.updateRecord(
            resourceName,
            id,
            data,
            primaryKey,
            false,
          );

          if (result.ok && result.value) {
            // Save changes to file
            await persistenceManager.saveToFile();
          }

          return result;
        } catch (error) {
          return err(
            error instanceof Error
              ? error
              : new Error(`Failed to update record: ${String(error)}`),
          );
        }
      },

      patch: async (id: string | number, data: Partial<DbRecord>) => {
        try {
          // Merge with existing data
          const result = store.updateRecord(
            resourceName,
            id,
            data,
            primaryKey,
            true,
          );

          if (result.ok && result.value) {
            // Save changes to file
            await persistenceManager.saveToFile();
          }

          return result;
        } catch (error) {
          return err(
            error instanceof Error
              ? error
              : new Error(`Failed to patch record: ${String(error)}`),
          );
        }
      },

      delete: async (id: string | number) => {
        try {
          // Get relationships that should be cascade deleted
          const cascadeRelationships = [];

          const relationshipsResult =
            relationshipExpander.getRelationships(resourceName);

          if (relationshipsResult.ok) {
            // For each hasMany relationship, we might want to cascade delete
            const relationships = relationshipsResult.value.filter(
              (r) => r.type === "hasMany" || r.type === "hasOne",
            );

            for (const rel of relationships) {
              cascadeRelationships.push({
                collection: rel.resource,
                foreignKey: rel.foreignKey,
              });
            }
          }

          const result = store.deleteRecord(
            resourceName,
            id,
            primaryKey,
            cascadeRelationships,
          );

          if (result.ok && result.value) {
            // Save changes to file
            await persistenceManager.saveToFile();
          }

          return result;
        } catch (error) {
          return err(
            error instanceof Error
              ? error
              : new Error(`Failed to delete record: ${String(error)}`),
          );
        }
      },

      findRelated: async (
        id: string | number,
        relationship: string,
        options?: QueryOptions,
      ) => {
        try {
          return relationshipExpander.findRelatedRecords(
            resourceName,
            id,
            relationship,
            options,
          );
        } catch (error) {
          return err(
            error instanceof Error
              ? error
              : new Error(`Failed to find related records: ${String(error)}`),
          );
        }
      },
    };

    return ok(resourceOps);
  };

  const reset = async (): Promise<Result<void, Error>> => {
    try {
      // Reset the store to initial state
      const resetResult = store.reset({});

      if (!resetResult.ok) {
        return resetResult;
      }

      // Save the empty state
      return await persistenceManager.saveToFile();
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to reset database: ${String(error)}`),
      );
    }
  };

  const backup = async (path?: string): Promise<Result<string, Error>> => {
    try {
      return await persistenceManager.backup(path);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to backup database: ${String(error)}`),
      );
    }
  };

  const restore = async (path: string): Promise<Result<void, Error>> => {
    try {
      return await persistenceManager.restore(path);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to restore database: ${String(error)}`),
      );
    }
  };

  // Get database statistics
  const getStats = (): Record<string, { count: number; lastModified: number }> => {
    const stats: Record<string, { count: number; lastModified: number }> = {};
    
    // Get all resources
    for (const resource of initialConfig.resources) {
      const resourceName = resource.name;
      const data = store.getData(resourceName);
      
      if (data.ok) {
        stats[resourceName] = {
          count: data.value.length,
          lastModified: Date.now(), // Using current time as we don't track modification times
        };
      } else {
        stats[resourceName] = {
          count: 0,
          lastModified: Date.now(),
        };
      }
    }
    
    return stats;
  };

  return {
    initialize,
    getResource,
    reset,
    backup,
    restore,
    getStats,
  };
};
