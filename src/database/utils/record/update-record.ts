import { DbRecord, Result, ok } from "../../../types/index.js";
import { cloneDeep } from "lodash-es";

/**
 * Updates an existing record in a collection
 */
export const updateRecord = (
  storeData: Record<string, DbRecord[]>,
  collection: string,
  id: string | number,
  updateData: Partial<DbRecord>,
  primaryKey: string = "id",
  merge: boolean = true,
): Result<DbRecord | null, Error> => {
  // Auto-create collection if it doesn't exist
  if (!storeData[collection]) {
    storeData[collection] = [];
    return ok(null); // Return null since the record won't exist in a new collection
  }

  const index = storeData[collection].findIndex((r) => r[primaryKey] === id);
  if (index < 0) {
    return ok(null);
  }

  // Create updated record - either merge or replace
  const currentRecord = storeData[collection][index];
  const updatedRecord = merge
    ? { ...currentRecord, ...updateData, [primaryKey]: id } // Preserve ID on merge
    : { ...updateData, [primaryKey]: id }; // Always include ID on replace

  storeData[collection][index] = cloneDeep(updatedRecord);
  return ok(cloneDeep(updatedRecord));
};
