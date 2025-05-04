import { DbRecord, Result, ok } from "../../../types/index.js";
import { cloneDeep } from "lodash-es";

/**
 * Gets a record by ID from a collection
 */
export const getRecord = (
  storeData: Record<string, DbRecord[]>,
  collection: string,
  id: string | number,
  primaryKey: string = "id",
): Result<DbRecord | null, Error> => {
  // Auto-create collection if it doesn't exist
  if (!storeData[collection]) {
    storeData[collection] = [];
  }

  const record = storeData[collection].find((r) => r[primaryKey] === id);
  return ok(record ? cloneDeep(record) : null);
};
