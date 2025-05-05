import { DbRecord, QueryOptions, Result } from "../../types/index.js";
import { ResourceField } from "../../types/config.js";

/**
 * DatabaseAdapter interface defines the contract that all database adapters must implement.
 * This allows Pretendo to work with different storage backends while maintaining a consistent API.
 */
export interface DatabaseAdapter {
  /**
   * Initialize the adapter with any necessary setup
   * @param initialData Optional initial data to populate the adapter with
   * @param resourceFields Optional resource field definitions for validation
   * @returns A Result indicating success or failure
   */
  initialize(
    initialData?: Record<string, DbRecord[]>,
    resourceFields?: Record<string, ResourceField[]>,
  ): Promise<Result<void, Error>>;

  // Resource/Collection Operations

  /**
   * Get all resources of a specific type
   * @param resource The resource/collection name
   * @param query Optional query parameters for filtering, sorting, pagination etc.
   * @returns A Result containing the matching records or an error
   */
  getResources(
    resource: string,
    query?: QueryOptions,
  ): Promise<Result<DbRecord[], Error>>;

  /**
   * Get a specific resource by ID
   * @param resource The resource/collection name
   * @param id The unique identifier of the record
   * @returns A Result containing the record or null if not found
   */
  getResource(
    resource: string,
    id: string | number,
  ): Promise<Result<DbRecord | null, Error>>;

  /**
   * Create a new resource
   * @param resource The resource/collection name
   * @param data The data for the new record
   * @returns A Result containing the created record or an error
   */
  createResource(
    resource: string,
    data: DbRecord,
  ): Promise<Result<DbRecord, Error>>;

  /**
   * Update a resource completely (replace)
   * @param resource The resource/collection name
   * @param id The unique identifier of the record
   * @param data The new data for the record
   * @returns A Result containing the updated record or null if not found
   */
  updateResource(
    resource: string,
    id: string | number,
    data: DbRecord,
  ): Promise<Result<DbRecord | null, Error>>;

  /**
   * Partially update a resource (patch/merge)
   * @param resource The resource/collection name
   * @param id The unique identifier of the record
   * @param data The partial data to merge with the existing record
   * @returns A Result containing the updated record or null if not found
   */
  patchResource(
    resource: string,
    id: string | number,
    data: Partial<DbRecord>,
  ): Promise<Result<DbRecord | null, Error>>;

  /**
   * Delete a resource
   * @param resource The resource/collection name
   * @param id The unique identifier of the record to delete
   * @returns A Result indicating success (true) or failure
   */
  deleteResource(
    resource: string,
    id: string | number,
  ): Promise<Result<boolean, Error>>;

  /**
   * Find related resources based on a relationship
   * @param resource The resource/collection name
   * @param id The unique identifier of the record
   * @param relationship The name of the relationship to follow
   * @param query Optional query parameters for the related resources
   * @returns A Result containing the related records or an error
   */
  findRelated(
    resource: string,
    id: string | number,
    relationship: string,
    query?: QueryOptions,
  ): Promise<Result<DbRecord[], Error>>;

  // Database Management Operations

  /**
   * Creates a backup of the current data
   * @param backupPath Optional identifier or path for the backup
   * @returns A Result containing the backup identifier or an error
   */
  backup(backupPath?: string): Promise<Result<string, Error>>;

  /**
   * Restores data from a backup
   * @param backupPath Identifier or path of the backup to restore from
   * @returns A Result containing the restored data or an error
   */
  restore(
    backupPath: string,
  ): Promise<Result<Record<string, DbRecord[]>, Error>>;

  /**
   * Clears all data in the database
   * @returns A Result indicating success or failure
   */
  reset(): Promise<Result<void, Error>>;

  /**
   * Gets statistics about the database (e.g., record counts)
   * @returns An object with statistics for each resource
   */
  getStats(): Record<string, { count: number; lastModified: number }>;

  /**
   * Saves current data to storage
   * @param data The data to save
   * @returns A Result indicating success or failure
   */
  save(data: Record<string, DbRecord[]>): Promise<Result<void, Error>>;

  /**
   * Loads data from storage
   * @returns A Result containing the loaded data or an error
   */
  load(): Promise<Result<Record<string, DbRecord[]>, Error>>;
}

/**
 * Configuration options for database adapters
 */
export interface DatabaseAdapterOptions {
  /**
   * Path to store data (for file-based adapters)
   */
  dbPath?: string;

  /**
   * Whether to automatically save data on changes
   */
  autoSave?: boolean;

  /**
   * Interval in milliseconds between auto-saves
   */
  saveInterval?: number;

  /**
   * Whether to enable strict validation for resource fields
   */
  strictValidation?: boolean;

  /**
   * Resource field definitions for validation
   */
  resourceFields?: Record<string, ResourceField[]>;

  /**
   * Custom adapter options
   */
  [key: string]: unknown;
}
