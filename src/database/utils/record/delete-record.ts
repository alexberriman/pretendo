import { DbRecord, Result, ok } from "../../../types/index.js";

/**
 * Deletes a record from a collection
 */
export const deleteRecord = (
  storeData: Record<string, DbRecord[]>,
  collection: string,
  id: string | number,
  primaryKey: string = "id",
  cascadeRelationships?: Array<{ collection: string; foreignKey: string }>,
): Result<boolean, Error> => {
  // Auto-create collection if it doesn't exist
  if (!storeData[collection]) {
    storeData[collection] = [];
    return ok(false); // No records to delete in a new collection
  }

  const index = storeData[collection].findIndex((r) => r[primaryKey] === id);
  if (index < 0) {
    return ok(false);
  }

  // Handle cascade deletes
  if (cascadeRelationships && cascadeRelationships.length > 0) {
    for (const rel of cascadeRelationships) {
      // Auto-create related collection if it doesn't exist
      if (!storeData[rel.collection]) {
        storeData[rel.collection] = [];
        continue; // Skip this relation since there's nothing to delete
      }

      // Delete all related records
      storeData[rel.collection] = storeData[rel.collection].filter(
        (r: DbRecord) => r[rel.foreignKey] !== id,
      );
    }
  }

  // Delete the record
  storeData[collection].splice(index, 1);
  return ok(true);
};
