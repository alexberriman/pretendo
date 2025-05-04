import {
  DbRecord,
  QueryOptions,
  ResourceOperation,
  err,
  ok,
} from "../../types/index.js";
import { PersistenceManager } from "../persistence.js";
import { Store } from "../../types/index.js";
import { RelationshipExpander } from "../relations.js";

/**
 * Creates CRUD operations for a specific resource
 */
export const createResourceOperations = (
  resourceName: string,
  primaryKey: string,
  store: Store,
  persistenceManager: PersistenceManager,
  relationshipExpander: RelationshipExpander,
): ResourceOperation => {
  const resourceOps: ResourceOperation = {
    findAll: async (options?: QueryOptions) => {
      try {
        let result = store.query(resourceName, options);

        if (!result.ok) {
          return result;
        }

        // Handle relationship expansion if requested
        if (options?.expand && options.expand.length > 0) {
          result = relationshipExpander.expandRelationships(
            resourceName,
            result.value,
            options.expand,
          );
        }

        return result;
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
        return store.getRecord(resourceName, id, primaryKey);
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

        // Run the query
        const result = await resourceOps.findAll(filters);

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
        const result = store.addRecord(
          resourceName,
          data as DbRecord,
          primaryKey,
        );

        if (result.ok) {
          // Save changes to file
          await persistenceManager.saveToFile();
        }

        return result;
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
        // Do a full replace, not a merge
        const result = store.updateRecord(
          resourceName,
          id,
          data,
          primaryKey,
          false,
        );

        if (result.ok && result.value) {
          // Save changes to file
          await persistenceManager.saveToFile();
        }

        return result;
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
        // Merge with existing data
        const result = store.updateRecord(
          resourceName,
          id,
          data,
          primaryKey,
          true,
        );

        if (result.ok && result.value) {
          // Save changes to file
          await persistenceManager.saveToFile();
        }

        return result;
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
        // Get relationships that should be cascade deleted
        const cascadeRelationships = [];

        const relationshipsResult =
          relationshipExpander.getRelationships(resourceName);

        if (relationshipsResult.ok) {
          // For each hasMany relationship, we might want to cascade delete
          const relationships = relationshipsResult.value.filter(
            (r) => r.type === "hasMany" || r.type === "hasOne",
          );

          for (const rel of relationships) {
            cascadeRelationships.push({
              collection: rel.resource,
              foreignKey: rel.foreignKey,
            });
          }
        }

        const result = store.deleteRecord(
          resourceName,
          id,
          primaryKey,
          cascadeRelationships,
        );

        if (result.ok && result.value) {
          // Save changes to file
          await persistenceManager.saveToFile();
        }

        return result;
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
        return relationshipExpander.findRelatedRecords(
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
