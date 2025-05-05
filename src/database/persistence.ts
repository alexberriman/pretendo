import { DbRecord, Result, Store, err } from "../types/index.js";
import { DatabaseAdapter } from "./adapters/adapter.js";
import { createAdapter } from "./adapters/factory.js";

export type PersistenceOptions = {
  dbPath?: string;
  autoSave?: boolean;
  saveInterval?: number;
  adapter?: string | object;
};

export type PersistenceManager = {
  saveToFile: () => Promise<Result<void, Error>>;
  loadFromFile: () => Promise<Result<void, Error>>;
  backup: (backupPath?: string) => Promise<Result<string, Error>>;
  restore: (backupPath: string) => Promise<Result<void, Error>>;
};

export const createPersistenceManager = (
  store: Store,
  options: PersistenceOptions,
): PersistenceManager => {
  const {
    dbPath = "./db.json",
    autoSave = true,
    saveInterval = 5000,
    adapter = "json-file",
  } = options;

  let _saveTimer: NodeJS.Timeout | null = null;

  // Initialize adapter
  const adapterResult = createAdapter(adapter as string, {
    dbPath,
    autoSave,
    saveInterval,
  });

  if (!adapterResult.ok) {
    throw adapterResult.error;
  }

  const dbAdapter: DatabaseAdapter = adapterResult.value;

  // Initialize the adapter
  (async () => {
    await dbAdapter.initialize();
  })();

  // Save data to storage
  const saveToFile = async (): Promise<Result<void, Error>> => {
    try {
      // Get data from store
      const data = store.getData();

      // If data is a Result type (error), return the error
      if ("ok" in data && !data.ok) {
        return err(
          data.error instanceof Error
            ? data.error
            : new Error(`Failed to get data from store: ${String(data.error)}`),
        );
      }

      // Save to adapter
      const saveResult = await dbAdapter.save(
        typeof data === "object" && data !== null
          ? (data as Record<string, DbRecord[]>)
          : {},
      );

      return saveResult;
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to save data: ${String(error)}`),
      );
    }
  };

  // Load data from storage
  const loadFromFile = async (): Promise<Result<void, Error>> => {
    try {
      // Load from adapter
      const loadResult = await dbAdapter.load();

      if (!loadResult.ok) {
        return loadResult;
      }

      // Reset store with loaded data
      const data = loadResult.value;
      const resetResult = store.reset(data);

      return resetResult;
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to load data: ${String(error)}`),
      );
    }
  };

  // Create a backup
  const backup = async (
    backupPath?: string,
  ): Promise<Result<string, Error>> => {
    try {
      return await dbAdapter.backup(backupPath);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to create backup: ${String(error)}`),
      );
    }
  };

  // Restore from backup
  const restore = async (backupPath: string): Promise<Result<void, Error>> => {
    try {
      // Restore via adapter
      const restoreResult = await dbAdapter.restore(backupPath);

      if (!restoreResult.ok) {
        return err(restoreResult.error);
      }

      // Reset store with loaded data
      const data = restoreResult.value;
      const resetResult = store.reset(data);

      return resetResult;
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to restore from backup: ${String(error)}`),
      );
    }
  };

  // Setup auto-save if enabled
  if (autoSave && saveInterval > 0) {
    _saveTimer = setInterval(async () => {
      await saveToFile();
    }, saveInterval);
  }

  return {
    saveToFile,
    loadFromFile,
    backup,
    restore,
  };
};
