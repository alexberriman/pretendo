import { ApiConfig, ReadonlyDeep, Result, err, ok } from "../../types/index.js";
import { Store } from "../../types/index.js";
import { PersistenceManager } from "../persistence.js";

/**
 * Initializes the database service with the provided configuration
 */
export const initialize = async (
  config: ReadonlyDeep<ApiConfig>,
  createStore: (config: ApiConfig) => Store,
  createPersistenceManager: (
    store: Store,
    options: { dbPath: string },
  ) => PersistenceManager,
  store: Store,
  setPersistenceManager: (pm: PersistenceManager) => void,
  setStore: (store: Store) => void,
): Promise<Result<void, Error>> => {
  try {
    // Clone and cast to bypass readonly constraints
    const mutableConfig = JSON.parse(JSON.stringify(config)) as ApiConfig;

    // Create new instances with the provided config
    const newStore = createStore(mutableConfig);
    setStore(newStore);

    const persistenceManager = createPersistenceManager(newStore, {
      dbPath: config.options?.dbPath || "./db.json",
    });
    setPersistenceManager(persistenceManager);

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
