import { DbRecord, Result, ok } from "../../../types/index.js";
import { cloneDeep } from "lodash-es";

/**
 * Gets all data or a specific collection from the store
 */
export const getData = (
  storeData: Record<string, DbRecord[]>,
  collection?: string,
): Record<string, DbRecord[]> | Result<DbRecord[], Error> => {
  if (collection) {
    // Auto-create collection if it doesn't exist
    if (!storeData[collection]) {
      storeData[collection] = [];
    }
    return ok(cloneDeep(storeData[collection]));
  }
  return cloneDeep(storeData);
};
