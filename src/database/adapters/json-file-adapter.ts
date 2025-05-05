import fs from "fs/promises";
import path from "path";
import { cloneDeep } from "lodash-es";
import { DbRecord, QueryOptions, Result, err, ok } from "../../types/index.js";
import { DatabaseAdapter, DatabaseAdapterOptions } from "./adapter.js";
import {
  applyFilter,
  applyPagination,
  applySorting,
  selectFields,
} from "../utils/index.js";

/**
 * JsonFileAdapter implements the DatabaseAdapter interface for JSON file storage.
 * This adapter saves and loads data from a JSON file on the file system.
 */
export class JsonFileAdapter implements DatabaseAdapter {
  private dbPath: string;
  private data: Record<string, DbRecord[]>;
  private lastModified: Record<string, number>;

  /**
   * Create a new JsonFileAdapter
   * @param options The adapter options
   */
  constructor(options: DatabaseAdapterOptions) {
    this.dbPath = options.dbPath || "./db.json";
    this.data = {};
    this.lastModified = {};
  }

  /**
   * Initialize the adapter by loading data from file or using initial data
   * @param initialData Optional data to use if the file doesn't exist
   */
  async initialize(
    initialData?: Record<string, DbRecord[]>,
  ): Promise<Result<void, Error>> {
    try {
      // Check if the file exists and load it
      const existsResult = await this.fileExists(this.dbPath);

      if (!existsResult.ok) {
        return existsResult;
      }

      if (existsResult.value) {
        // File exists, load it
        const loadResult = await this.loadFromFile();
        if (!loadResult.ok) {
          return loadResult;
        }
      } else if (initialData && Object.keys(initialData).length > 0) {
        // File doesn't exist but we have initial data
        this.data = cloneDeep(initialData);

        // Update timestamps
        for (const resource in this.data) {
          this.lastModified[resource] = Date.now();
        }

        // Save the initial data to file
        const saveResult = await this.saveToFile();
        if (!saveResult.ok) {
          return saveResult;
        }
      } else {
        // Create an empty database file
        const saveResult = await this.saveToFile();
        if (!saveResult.ok) {
          return saveResult;
        }
      }

      return ok(undefined);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to initialize adapter: ${String(error)}`),
      );
    }
  }

  /**
   * Get all resources of a specific type with filtering, sorting, pagination
   */
  async getResources(
    resource: string,
    query?: QueryOptions,
  ): Promise<Result<DbRecord[], Error>> {
    try {
      if (!this.data[resource]) {
        return ok([]);
      }

      let records = cloneDeep(this.data[resource]);

      // Apply filters if provided
      if (query?.filters && query.filters.length > 0) {
        for (const filter of query.filters) {
          records = records.filter((record) => applyFilter(record, filter));
        }
      }

      // Apply sorting if provided
      if (query?.sort && query.sort.length > 0) {
        records = applySorting(records, query.sort);
      }

      // Apply pagination if provided
      if (query?.page !== undefined || query?.perPage !== undefined) {
        const page = query.page || 1;
        const perPage = query.perPage || 10;
        records = applyPagination(records, page, perPage);
      }

      // Apply field selection if provided
      if (query?.fields && query.fields.length > 0) {
        records = records.map(
          (record) => selectFields(record, query.fields!) as DbRecord,
        );
      }

      return ok(records);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(
              `Failed to get resources from '${resource}': ${String(error)}`,
            ),
      );
    }
  }

  /**
   * Get a specific resource by ID
   */
  async getResource(
    resource: string,
    id: string | number,
  ): Promise<Result<DbRecord | null, Error>> {
    try {
      if (!this.data[resource]) {
        return ok(null);
      }

      // Find the record by ID, assuming "id" is the primary key
      const record = this.data[resource].find((r) => r.id === id);
      return ok(record ? cloneDeep(record) : null);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(
              `Failed to get resource '${id}' from '${resource}': ${String(error)}`,
            ),
      );
    }
  }

  /**
   * Create a new resource
   */
  async createResource(
    resource: string,
    data: DbRecord,
  ): Promise<Result<DbRecord, Error>> {
    try {
      // Ensure the collection exists
      if (!this.data[resource]) {
        this.data[resource] = [];
      }

      // Create a copy of the data to avoid modifying the original
      const newRecord = cloneDeep(data);

      // Generate an ID if one isn't provided
      if (newRecord.id === undefined) {
        const highestId = this.data[resource].reduce((max, record) => {
          const recordId = Number(record.id);
          return isNaN(recordId) ? max : Math.max(max, recordId);
        }, 0);
        newRecord.id = highestId + 1;
      }

      // Add the record to the collection
      this.data[resource].push(newRecord);

      // Update last modified timestamp
      this.lastModified[resource] = Date.now();

      // Save changes to file
      const saveResult = await this.saveToFile();
      if (!saveResult.ok) {
        return err(saveResult.error);
      }

      return ok(cloneDeep(newRecord));
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(
              `Failed to create resource in '${resource}': ${String(error)}`,
            ),
      );
    }
  }

  /**
   * Update a resource completely (replace)
   */
  async updateResource(
    resource: string,
    id: string | number,
    data: DbRecord,
  ): Promise<Result<DbRecord | null, Error>> {
    try {
      if (!this.data[resource]) {
        return ok(null);
      }

      // Find the index of the record
      const index = this.data[resource].findIndex((r) => r.id === id);
      if (index === -1) {
        return ok(null);
      }

      // Create a copy of the data with the original ID
      const updatedRecord = { ...cloneDeep(data), id };

      // Replace the record
      this.data[resource][index] = updatedRecord;

      // Update last modified timestamp
      this.lastModified[resource] = Date.now();

      // Save changes to file
      const saveResult = await this.saveToFile();
      if (!saveResult.ok) {
        return err(saveResult.error);
      }

      return ok(cloneDeep(updatedRecord));
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(
              `Failed to update resource '${id}' in '${resource}': ${String(error)}`,
            ),
      );
    }
  }

  /**
   * Partially update a resource (patch/merge)
   */
  async patchResource(
    resource: string,
    id: string | number,
    data: Partial<DbRecord>,
  ): Promise<Result<DbRecord | null, Error>> {
    try {
      if (!this.data[resource]) {
        return ok(null);
      }

      // Find the index of the record
      const index = this.data[resource].findIndex((r) => r.id === id);
      if (index === -1) {
        return ok(null);
      }

      // Create a copy of the existing record
      const existingRecord = cloneDeep(this.data[resource][index]);

      // Merge with the provided data
      const updatedRecord = { ...existingRecord, ...cloneDeep(data), id };

      // Replace the record
      this.data[resource][index] = updatedRecord;

      // Update last modified timestamp
      this.lastModified[resource] = Date.now();

      // Save changes to file
      const saveResult = await this.saveToFile();
      if (!saveResult.ok) {
        return err(saveResult.error);
      }

      return ok(cloneDeep(updatedRecord));
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(
              `Failed to patch resource '${id}' in '${resource}': ${String(error)}`,
            ),
      );
    }
  }

  /**
   * Delete a resource
   */
  async deleteResource(
    resource: string,
    id: string | number,
  ): Promise<Result<boolean, Error>> {
    try {
      if (!this.data[resource]) {
        return ok(false);
      }

      // Find the index of the record
      const index = this.data[resource].findIndex((r) => r.id === id);
      if (index === -1) {
        return ok(false);
      }

      // Remove the record
      this.data[resource].splice(index, 1);

      // Update last modified timestamp
      this.lastModified[resource] = Date.now();

      // Save changes to file
      const saveResult = await this.saveToFile();
      if (!saveResult.ok) {
        return err(saveResult.error);
      }

      return ok(true);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(
              `Failed to delete resource '${id}' from '${resource}': ${String(error)}`,
            ),
      );
    }
  }

  /**
   * Find related resources based on a relationship
   * Basic implementation that assumes foreign key matches the resource name + 'Id'
   */
  async findRelated(
    resource: string,
    id: string | number,
    relationship: string,
    query?: QueryOptions,
  ): Promise<Result<DbRecord[], Error>> {
    try {
      // For simple implementation, assume relationships use conventional naming
      // e.g., post -> comments relationship uses 'postId' as foreign key in comments
      const foreignKey = `${resource.slice(0, -1)}Id`; // users -> userId, posts -> postId

      if (!this.data[relationship]) {
        return ok([]);
      }

      // Filter related records
      let relatedRecords = this.data[relationship].filter(
        (r) => r[foreignKey] === id,
      );

      // Apply additional query options
      if (query) {
        // Apply filters
        if (query.filters && query.filters.length > 0) {
          for (const filter of query.filters) {
            relatedRecords = relatedRecords.filter((record) =>
              applyFilter(record, filter),
            );
          }
        }

        // Apply sorting
        if (query.sort && query.sort.length > 0) {
          relatedRecords = applySorting(relatedRecords, query.sort);
        }

        // Apply pagination
        if (query.page !== undefined || query.perPage !== undefined) {
          const page = query.page || 1;
          const perPage = query.perPage || 10;
          relatedRecords = applyPagination(relatedRecords, page, perPage);
        }

        // Apply field selection
        if (query.fields && query.fields.length > 0) {
          relatedRecords = relatedRecords.map(
            (record) => selectFields(record, query.fields!) as DbRecord,
          );
        }
      }

      return ok(cloneDeep(relatedRecords));
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to find related records: ${String(error)}`),
      );
    }
  }

  /**
   * Creates a backup of the current data
   */
  async backup(backupPath?: string): Promise<Result<string, Error>> {
    try {
      // Check if source file exists
      const existsResult = await this.fileExists(this.dbPath);
      if (!existsResult.ok) {
        return err(existsResult.error);
      }

      if (!existsResult.value) {
        return err(
          new Error(
            `Cannot backup: source file does not exist at ${this.dbPath}`,
          ),
        );
      }

      // Generate backup path if not provided
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const defaultBackupPath = `${this.dbPath}.${timestamp}.backup`;
      const targetPath = backupPath || defaultBackupPath;

      // Ensure backup directory exists
      const directoryResult = await this.ensureDirectoryExists(targetPath);
      if (!directoryResult.ok) {
        return err(directoryResult.error);
      }

      // Copy file
      await fs.copyFile(this.dbPath, targetPath);
      return ok(targetPath);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to create backup: ${String(error)}`),
      );
    }
  }

  /**
   * Restores data from a backup
   */
  async restore(
    backupPath: string,
  ): Promise<Result<Record<string, DbRecord[]>, Error>> {
    try {
      // Check if backup file exists
      const existsResult = await this.fileExists(backupPath);
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
      const directoryResult = await this.ensureDirectoryExists(this.dbPath);
      if (!directoryResult.ok) {
        return err(directoryResult.error);
      }

      // Copy backup to main file
      await fs.copyFile(backupPath, this.dbPath);

      // Reload data
      const loadResult = await this.loadFromFile();
      if (!loadResult.ok) {
        return err(loadResult.error);
      }

      // Return a copy of the data
      return ok(cloneDeep(this.data));
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to restore from backup: ${String(error)}`),
      );
    }
  }

  /**
   * Resets the database to an empty state
   */
  async reset(): Promise<Result<void, Error>> {
    try {
      // Clear all data
      this.data = {};
      this.lastModified = {};

      // Save the empty state to file
      return await this.saveToFile();
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to reset database: ${String(error)}`),
      );
    }
  }

  /**
   * Gets statistics about the database
   */
  getStats(): Record<string, { count: number; lastModified: number }> {
    const stats: Record<string, { count: number; lastModified: number }> = {};

    for (const [resource, records] of Object.entries(this.data)) {
      stats[resource] = {
        count: records.length,
        lastModified: this.lastModified[resource] || 0,
      };
    }

    return stats;
  }

  // Helper methods

  /**
   * Ensures that the directory for a file exists
   */
  private async ensureDirectoryExists(
    filePath: string,
  ): Promise<Result<void, Error>> {
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
  }

  /**
   * Checks if a file exists
   */
  private async fileExists(filePath: string): Promise<Result<boolean, Error>> {
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
  }

  /**
   * Loads data from file into memory
   */
  private async loadFromFile(): Promise<Result<void, Error>> {
    try {
      const fileContent = await fs.readFile(this.dbPath, "utf-8");

      try {
        const loadedData = JSON.parse(fileContent);
        this.data = loadedData;

        // Update last modified timestamps
        for (const resource in this.data) {
          this.lastModified[resource] = Date.now();
        }

        return ok(undefined);
      } catch (parseError) {
        return err(
          parseError instanceof Error
            ? parseError
            : new Error(`Failed to parse JSON: ${String(parseError)}`),
        );
      }
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to load data from file: ${String(error)}`),
      );
    }
  }

  /**
   * Saves data from memory to file
   */
  private async saveToFile(): Promise<Result<void, Error>> {
    try {
      // Ensure directory exists
      const directoryResult = await this.ensureDirectoryExists(this.dbPath);
      if (!directoryResult.ok) {
        return directoryResult;
      }

      // Save data
      const jsonData = JSON.stringify(this.data, null, 2);
      await fs.writeFile(this.dbPath, jsonData, "utf-8");
      return ok(undefined);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to save data to file: ${String(error)}`),
      );
    }
  }

  /**
   * Saves data to storage
   */
  async save(data: Record<string, DbRecord[]>): Promise<Result<void, Error>> {
    try {
      // Update the internal data
      this.data = cloneDeep(data);

      // Update timestamps
      for (const resource in this.data) {
        this.lastModified[resource] = Date.now();
      }

      // Save to file
      return await this.saveToFile();
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to save data: ${String(error)}`),
      );
    }
  }

  /**
   * Loads data from storage
   */
  async load(): Promise<Result<Record<string, DbRecord[]>, Error>> {
    try {
      // Check if the file exists
      const existsResult = await this.fileExists(this.dbPath);
      if (!existsResult.ok) {
        return err(existsResult.error);
      }

      if (!existsResult.value) {
        // File doesn't exist, return empty data
        return ok({});
      }

      // Load from file
      const loadResult = await this.loadFromFile();
      if (!loadResult.ok) {
        return err(loadResult.error);
      }

      // Return a copy of the data
      return ok(cloneDeep(this.data));
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to load data: ${String(error)}`),
      );
    }
  }
}
