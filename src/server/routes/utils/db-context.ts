import { DatabaseService } from "../../../types/index.js";
import { RouteDatabase } from "./js-route-context.js";

/**
 * Creates a database context object for JavaScript routes
 * This provides a simplified interface to database operations for route scripts
 * @param db The database service
 * @returns Database context object or null if database service is not provided
 */
export const createDatabaseContext = (
  db?: DatabaseService,
): RouteDatabase | null => {
  if (!db) {
    return null;
  }

  return {
    /**
     * Get a resource by ID
     */
    async getResourceById(resourceName: string, id: string | number) {
      const resourceResult = db.getResource(resourceName);
      if (!resourceResult.ok) return null;

      const result = await resourceResult.value.findById(id);
      if (!result.ok) return null;

      return result.value;
    },

    /**
     * Get all resources with optional filtering
     */
    async getResources(resourceName: string, options = {}) {
      const resourceResult = db.getResource(resourceName);
      if (!resourceResult.ok) return null;

      const result = await resourceResult.value.findAll(options);
      if (!result.ok) return null;

      return result.value;
    },

    /**
     * Create a new resource
     */
    async createResource(resourceName: string, data: Record<string, unknown>) {
      const resourceResult = db.getResource(resourceName);
      if (!resourceResult.ok) return null;

      const result = await resourceResult.value.create(data);
      if (!result.ok) return null;

      return result.value;
    },

    /**
     * Update an existing resource
     */
    async updateResource(
      resourceName: string,
      id: string | number,
      data: Record<string, unknown>,
    ) {
      const resourceResult = db.getResource(resourceName);
      if (!resourceResult.ok) return null;

      const result = await resourceResult.value.update(id, data);
      if (!result.ok) return null;

      return result.value;
    },

    /**
     * Delete a resource
     */
    async deleteResource(resourceName: string, id: string | number) {
      const resourceResult = db.getResource(resourceName);
      if (!resourceResult.ok) return null;

      const result = await resourceResult.value.delete(id);
      if (!result.ok) return null;

      return result.value;
    },

    /**
     * Get related resources
     */
    async getRelatedResources(
      resourceName: string,
      id: string | number,
      relationship: string,
      _options = {},
    ) {
      const resourceResult = db.getResource(resourceName);
      if (!resourceResult.ok) return null;

      // This functionality would need to be implemented based on the specific
      // relationship query capabilities of the database service
      // For now, return an empty array as a placeholder
      return [];
    },
  };
};
