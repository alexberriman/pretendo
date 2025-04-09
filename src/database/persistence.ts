import fs from "fs/promises";
import path from "path";
import { Result, err, ok } from "../types/index.js";
import { Store } from "./store.js";

export type PersistenceOptions = {
  dbPath: string;
  autoSave?: boolean;
  backupOnSave?: boolean;
  saveInterval?: number; // In milliseconds
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
    dbPath,
    autoSave = true,
    backupOnSave = false,
    saveInterval = 5000,
  } = options;

  let _saveTimer: NodeJS.Timeout | null = null;

  // Create directories if they don't exist
  const ensureDirectoryExists = async (
    filePath: string,
  ): Promise<Result<void, Error>> => {
    try {
      const directory = path.dirname(filePath);
      await fs.mkdir(directory, { recursive: true });
      return ok(undefined);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to create directory: ${String(error)}`),
      );
    }
  };

  // Save data to file
  const saveToFile = async (): Promise<Result<void, Error>> => {
    try {
      // Ensure directory exists
      const directoryResult = await ensureDirectoryExists(dbPath);
      if (!directoryResult.ok) {
        return directoryResult;
      }

      // Create backup if needed
      if (backupOnSave) {
        const existsResult = await fileExists(dbPath);
        if (existsResult.ok && existsResult.value) {
          const backupResult = await backup();
          if (!backupResult.ok) {
            return backupResult;
          }
        }
      }

      // Save data
      const data = store.getData();
      const jsonData = JSON.stringify(data, null, 2);
      await fs.writeFile(dbPath, jsonData, "utf-8");
      return ok(undefined);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to save data: ${String(error)}`),
      );
    }
  };

  // Load data from file
  const loadFromFile = async (): Promise<Result<void, Error>> => {
    try {
      // Check if file exists
      const existsResult = await fileExists(dbPath);
      if (!existsResult.ok) {
        return existsResult;
      }

      if (!existsResult.value) {
        // File doesn't exist, create empty file
        const saveResult = await saveToFile();
        return saveResult;
      }

      // Read file and parse
      const fileContent = await fs.readFile(dbPath, "utf-8");
      let data = {};

      try {
        data = JSON.parse(fileContent);
      } catch (parseError) {
        return err(
          parseError instanceof Error
            ? parseError
            : new Error(`Failed to parse JSON: ${String(parseError)}`),
        );
      }

      // Reset store with loaded data
      const resetResult = store.reset(data);
      if (!resetResult.ok) {
        return resetResult;
      }

      return ok(undefined);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to load data: ${String(error)}`),
      );
    }
  };

  // Check if file exists
  const fileExists = async (
    filePath: string,
  ): Promise<Result<boolean, Error>> => {
    try {
      await fs.access(filePath);
      return ok(true);
    } catch (error) {
      // File doesn't exist
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return ok(false);
      }

      // Other error
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to check if file exists: ${String(error)}`),
      );
    }
  };

  // Create a backup
  const backup = async (
    backupPath?: string,
  ): Promise<Result<string, Error>> => {
    try {
      // Check if source file exists
      const existsResult = await fileExists(dbPath);
      if (!existsResult.ok) {
        return err(existsResult.error);
      }

      if (!existsResult.value) {
        return err(
          new Error(`Cannot backup: source file does not exist at ${dbPath}`),
        );
      }

      // Generate backup path if not provided
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const defaultBackupPath = `${dbPath}.${timestamp}.backup`;
      const targetPath = backupPath || defaultBackupPath;

      // Ensure backup directory exists
      const directoryResult = await ensureDirectoryExists(targetPath);
      if (!directoryResult.ok) {
        return err(directoryResult.error);
      }

      // Copy file
      await fs.copyFile(dbPath, targetPath);
      return ok(targetPath);
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
      // Check if backup file exists
      const existsResult = await fileExists(backupPath);
      if (!existsResult.ok) {
        return err(existsResult.error);
      }

      if (!existsResult.value) {
        return err(
          new Error(
            `Cannot restore: backup file does not exist at ${backupPath}`,
          ),
        );
      }

      // Ensure target directory exists
      const directoryResult = await ensureDirectoryExists(dbPath);
      if (!directoryResult.ok) {
        return err(directoryResult.error);
      }

      // Create backup of current file if it exists
      const currentExists = await fileExists(dbPath);
      if (currentExists.ok && currentExists.value) {
        const currentBackupResult = await backup();
        if (!currentBackupResult.ok) {
          return err(currentBackupResult.error);
        }
      }

      // Copy backup to main file
      await fs.copyFile(backupPath, dbPath);

      // Reload data
      return await loadFromFile();
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
