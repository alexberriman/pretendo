import { cloneDeep } from "lodash-es";
import { DbRecord, QueryOptions, Result, err, ok } from "../../types/index.js";
import { ResourceField } from "../../types/config.js";
import { DatabaseAdapter, DatabaseAdapterOptions } from "./adapter.js";
import {
  applyFilter,
  applyPagination,
  applySorting,
  selectFields,
  validateRecord,
  formatValidationErrors,
} from "../utils/index.js";

/**
 * MemoryAdapter implements the DatabaseAdapter interface for in-memory storage.
 * This adapter keeps all data in memory and doesn't persist across application restarts.
 * It's useful for testing and scenarios where persistence is not needed.
 */
export class MemoryAdapter implements DatabaseAdapter {
  private data: Record<string, DbRecord[]>;
  private lastModified: Record<string, number>;
  private snapshots: Map<string, Record<string, DbRecord[]>>;
  private resourceFields: Record<string, ResourceField[]>;
  private strictValidation: boolean;

  /**
   * Create a new MemoryAdapter
   */
  constructor(options: DatabaseAdapterOptions = {}) {
    this.data = {};
    this.lastModified = {};
    this.snapshots = new Map();
    this.resourceFields = {};
    // Enable validation if strictValidation is set in options
    this.strictValidation = options.strictValidation === true;
  }

  /**
   * Initialize the adapter with optional initial data
   * @param initialData Optional data to populate the adapter with
   */
  async initialize(
    initialData?: Record<string, DbRecord[]>,
    resourceFields?: Record<string, ResourceField[]>,
  ): Promise<Result<void, Error>> {
    try {
      // If initial data is provided, use it
      if (initialData && Object.keys(initialData).length > 0) {
        this.data = cloneDeep(initialData);

        // Set last modified timestamps
        for (const resource in this.data) {
          this.lastModified[resource] = Date.now();
        }
      }

      // If resource fields are provided, store them for validation
      if (resourceFields) {
        this.resourceFields = cloneDeep(resourceFields);
      }

      return ok(undefined);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to initialize memory adapter: ${String(error)}`),
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

      // Validate the record if validation is enabled and fields are available
      if (this.strictValidation && this.resourceFields[resource]) {
        const existingRecords = this.data[resource] || [];
        const validationResult = validateRecord(
          newRecord,
          this.resourceFields[resource],
          resource,
          existingRecords,
        );

        if (!validationResult.ok) {
          const errorMessage = formatValidationErrors(validationResult.error);
          return err(new Error(`Validation failed: ${errorMessage}`));
        }
      }

      // Add the record to the collection
      this.data[resource].push(newRecord);

      // Update last modified timestamp
      this.lastModified[resource] = Date.now();

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

      // Validate the record if validation is enabled and fields are available
      if (this.strictValidation && this.resourceFields[resource]) {
        const existingRecords = this.data[resource] || [];
        const validationResult = validateRecord(
          updatedRecord,
          this.resourceFields[resource],
          resource,
          existingRecords,
          false, // isUpdate=false for full replace
        );

        if (!validationResult.ok) {
          const errorMessage = formatValidationErrors(validationResult.error);
          return err(new Error(`Validation failed: ${errorMessage}`));
        }
      }

      // Replace the record
      this.data[resource][index] = updatedRecord;

      // Update last modified timestamp
      this.lastModified[resource] = Date.now();

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

      // Validate the record if validation is enabled and fields are available
      if (this.strictValidation && this.resourceFields[resource]) {
        const existingRecords = this.data[resource] || [];
        const validationResult = validateRecord(
          updatedRecord,
          this.resourceFields[resource],
          resource,
          existingRecords,
          true, // isUpdate=true for patch/merge
        );

        if (!validationResult.ok) {
          const errorMessage = formatValidationErrors(validationResult.error);
          return err(new Error(`Validation failed: ${errorMessage}`));
        }
      }

      // Replace the record
      this.data[resource][index] = updatedRecord;

      // Update last modified timestamp
      this.lastModified[resource] = Date.now();

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
   * Creates a backup (snapshot) of the current data
   */
  async backup(backupId?: string): Promise<Result<string, Error>> {
    try {
      // Generate a unique ID for the snapshot if not provided
      const snapshotId = backupId || `snapshot-${Date.now()}`;

      // Store a deep copy of the current data
      this.snapshots.set(snapshotId, cloneDeep(this.data));

      return ok(snapshotId);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to create memory backup: ${String(error)}`),
      );
    }
  }

  /**
   * Restores data from a backup (snapshot)
   */
  async restore(
    backupId: string,
  ): Promise<Result<Record<string, DbRecord[]>, Error>> {
    try {
      // Check if the snapshot exists
      if (!this.snapshots.has(backupId)) {
        return err(new Error(`Snapshot with ID '${backupId}' does not exist`));
      }

      // Restore from the snapshot
      const snapshot = this.snapshots.get(backupId);
      if (!snapshot) {
        return err(new Error(`Failed to restore from snapshot '${backupId}'`));
      }

      this.data = cloneDeep(snapshot);

      // Update last modified timestamps
      for (const resource in this.data) {
        this.lastModified[resource] = Date.now();
      }

      return ok(cloneDeep(this.data));
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to restore from memory backup: ${String(error)}`),
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

      return ok(undefined);
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

  /**
   * Resets the database to an empty state
   */
  async reset(): Promise<Result<void, Error>> {
    try {
      // Clear all data
      this.data = {};
      this.lastModified = {};

      return ok(undefined);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to reset memory database: ${String(error)}`),
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
}
