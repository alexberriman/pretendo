import { ApiConfig, DatabaseService, ReadonlyDeep } from "../types/index.js";

import { createStore } from "./store.js";
import { createPersistenceManager, PersistenceManager } from "./persistence.js";
import {
  createRelationshipExpander,
  RelationshipExpander,
} from "./relations.js";
import { Store } from "../types/index.js";

// Import service modules
import {
  initialize,
  getResource,
  getResourceConfig,
  reset,
  backup,
  restore,
  getStats,
} from "./service/index.js";

export const createDatabaseService = (
  initialConfig: ReadonlyDeep<ApiConfig>,
): DatabaseService => {
  // Clone and cast to bypass readonly constraints
  const mutableConfig = JSON.parse(JSON.stringify(initialConfig)) as ApiConfig;

  // Service instances that will be initialized
  let store: Store = createStore(mutableConfig);
  let persistenceManager: PersistenceManager = createPersistenceManager(store, {
    dbPath: initialConfig.options?.dbPath || "./db.json",
  });
  let relationshipExpander: RelationshipExpander = createRelationshipExpander(
    mutableConfig,
    store,
  );

  // Setter functions to allow updating service instances
  const setStore = (newStore: Store) => {
    store = newStore;
  };

  const setPersistenceManager = (newPersistenceManager: PersistenceManager) => {
    persistenceManager = newPersistenceManager;
  };

  const setRelationshipExpander = (
    newRelationshipExpander: RelationshipExpander,
  ) => {
    relationshipExpander = newRelationshipExpander;
  };

  return {
    initialize: async (config: ReadonlyDeep<ApiConfig>) => {
      const result = await initialize(
        config,
        createStore,
        createPersistenceManager,
        store,
        setPersistenceManager,
        setStore,
      );

      // If initialization succeeded, also recreate the relationship expander
      if (result.ok) {
        const mutableConfig = JSON.parse(JSON.stringify(config)) as ApiConfig;
        setRelationshipExpander(
          createRelationshipExpander(mutableConfig, store),
        );
      }

      return result;
    },

    getResource: (resourceName: string) => {
      return getResource(
        resourceName,
        mutableConfig,
        store,
        persistenceManager,
        relationshipExpander,
      );
    },

    getResourceConfig: (resourceName: string) => {
      return getResourceConfig(resourceName, mutableConfig);
    },

    reset: async () => {
      return reset(store, persistenceManager);
    },

    backup: async (path?: string) => {
      return backup(persistenceManager, path);
    },

    restore: async (path: string) => {
      return restore(persistenceManager, path);
    },

    getStats: () => {
      return getStats(mutableConfig, store);
    },
  };
};
