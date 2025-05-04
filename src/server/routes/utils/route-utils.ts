import {
  DatabaseService,
  DbRecord,
  QueryOptions,
  Result,
} from "../../../types/index.js";

/**
 * Utility class that provides database access functions for custom JavaScript routes
 */
export class RouteUtils {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Get a resource from the database by its ID
   */
  async getResourceById(
    resourceName: string,
    id: string | number,
  ): Promise<Result<DbRecord | null, Error>> {
    const resourceOp = this.db.getResource(resourceName);
    if (!resourceOp.ok) {
      return resourceOp;
    }

    return await resourceOp.value.findById(id);
  }

  /**
   * Get resources from the database with optional filtering, sorting, and pagination
   */
  async getResources(
    resourceName: string,
    options?: QueryOptions,
  ): Promise<Result<DbRecord[], Error>> {
    const resourceOp = this.db.getResource(resourceName);
    if (!resourceOp.ok) {
      return resourceOp;
    }

    return await resourceOp.value.findAll(options);
  }

  /**
   * Create a new resource in the database
   */
  async createResource(
    resourceName: string,
    data: Record<string, unknown>,
  ): Promise<Result<DbRecord, Error>> {
    const resourceOp = this.db.getResource(resourceName);
    if (!resourceOp.ok) {
      return resourceOp;
    }

    return await resourceOp.value.create(data);
  }

  /**
   * Update a resource in the database
   */
  async updateResource(
    resourceName: string,
    id: string | number,
    data: Record<string, unknown>,
  ): Promise<Result<DbRecord | null, Error>> {
    const resourceOp = this.db.getResource(resourceName);
    if (!resourceOp.ok) {
      return resourceOp;
    }

    return await resourceOp.value.update(id, data);
  }

  /**
   * Delete a resource from the database
   */
  async deleteResource(
    resourceName: string,
    id: string | number,
  ): Promise<Result<boolean, Error>> {
    const resourceOp = this.db.getResource(resourceName);
    if (!resourceOp.ok) {
      return resourceOp;
    }

    return await resourceOp.value.delete(id);
  }

  /**
   * Get related resources for a given resource ID
   */
  async getRelatedResources(
    resourceName: string,
    id: string | number,
    relationship: string,
    options?: QueryOptions,
  ): Promise<Result<DbRecord[], Error>> {
    const resourceOp = this.db.getResource(resourceName);
    if (!resourceOp.ok) {
      return resourceOp;
    }

    return await resourceOp.value.findRelated(id, relationship, options);
  }
}
