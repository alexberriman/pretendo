import { Result, err } from "../../types/index.js";
import { PersistenceManager } from "../persistence.js";
import { Store } from "../../types/index.js";

/**
 * Resets the database to an empty state
 */
export const reset = async (
  store: Store,
  persistenceManager: PersistenceManager,
): Promise<Result<void, Error>> => {
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

/**
 * Creates a backup of the database
 */
export const backup = async (
  persistenceManager: PersistenceManager,
  path?: string,
): Promise<Result<string, Error>> => {
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

/**
 * Restores the database from a backup
 */
export const restore = async (
  persistenceManager: PersistenceManager,
  path: string,
): Promise<Result<void, Error>> => {
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
