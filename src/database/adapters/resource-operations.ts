import {
  DbRecord,
  QueryOptions,
  ResourceOperation,
  err,
  ok,
} from "../../types/index.js";
import { DatabaseAdapter } from "./adapter.js";

/**
 * Creates ResourceOperation interface implementation using the database adapter
 * This bridges the previous ResourceOperation interface with the new adapter pattern
 */
export const createAdapterResourceOperations = (
  resourceName: string,
  adapter: DatabaseAdapter,
): ResourceOperation => {
  const resourceOps: ResourceOperation = {
    findAll: async (options?: QueryOptions) => {
      try {
        return await adapter.getResources(resourceName, options);
      } catch (error) {
        return err(
          error instanceof Error
            ? error
            : new Error(`Failed to find records: ${String(error)}`),
        );
      }
    },

    findById: async (id: string | number) => {
      try {
        return await adapter.getResource(resourceName, id);
      } catch (error) {
        return err(
          error instanceof Error
            ? error
            : new Error(`Failed to find record: ${String(error)}`),
        );
      }
    },

    findOne: async (query: Record<string, unknown>) => {
      try {
        // Build filters from query object
        const filters: QueryOptions = {
          filters: Object.entries(query).map(([field, value]) => ({
            field,
            operator: "eq",
            value,
            caseSensitive: true,
          })),
        };

        // Get the results
        const result = await adapter.getResources(resourceName, filters);

        // Return the first matching record, or null if none found
        if (result.ok && result.value.length > 0) {
          return ok(result.value[0]);
        }

        return ok(null);
      } catch (error) {
        return err(
          error instanceof Error
            ? error
            : new Error(`Failed to find record: ${String(error)}`),
        );
      }
    },

    create: async (data: Omit<DbRecord, "id">) => {
      try {
        return await adapter.createResource(resourceName, data as DbRecord);
      } catch (error) {
        return err(
          error instanceof Error
            ? error
            : new Error(`Failed to create record: ${String(error)}`),
        );
      }
    },

    update: async (id: string | number, data: Partial<DbRecord>) => {
      try {
        return await adapter.updateResource(resourceName, id, data as DbRecord);
      } catch (error) {
        return err(
          error instanceof Error
            ? error
            : new Error(`Failed to update record: ${String(error)}`),
        );
      }
    },

    patch: async (id: string | number, data: Partial<DbRecord>) => {
      try {
        return await adapter.patchResource(resourceName, id, data);
      } catch (error) {
        return err(
          error instanceof Error
            ? error
            : new Error(`Failed to patch record: ${String(error)}`),
        );
      }
    },

    delete: async (id: string | number) => {
      try {
        return await adapter.deleteResource(resourceName, id);
      } catch (error) {
        return err(
          error instanceof Error
            ? error
            : new Error(`Failed to delete record: ${String(error)}`),
        );
      }
    },

    findRelated: async (
      id: string | number,
      relationship: string,
      options?: QueryOptions,
    ) => {
      try {
        return await adapter.findRelated(
          resourceName,
          id,
          relationship,
          options,
        );
      } catch (error) {
        return err(
          error instanceof Error
            ? error
            : new Error(`Failed to find related records: ${String(error)}`),
        );
      }
    },
  };

  return resourceOps;
};
