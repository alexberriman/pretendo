import { DbRecord, Result, ok } from "../../../types/index.js";
import { cloneDeep } from "lodash-es";

/**
 * Gets a specific collection from the store
 */
export const getCollection = (
  storeData: Record<string, DbRecord[]>,
  name: string,
): Result<DbRecord[], Error> => {
  // Auto-create collection if it doesn't exist
  if (!storeData[name]) {
    storeData[name] = [];
  }
  return ok(cloneDeep(storeData[name]));
};
