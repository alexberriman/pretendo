import { DbRecord, Result, ok } from "../../../types/index.js";
import { cloneDeep } from "lodash-es";
import { generateId } from "../keys/generate-id.js";

/**
 * Sets a record in a collection, creating or updating it
 */
export const setRecord = (
  storeData: Record<string, DbRecord[]>,
  collection: string,
  record: DbRecord,
  primaryKey: string = "id",
): Result<DbRecord, Error> => {
  // Auto-create collection if it doesn't exist
  if (!storeData[collection]) {
    storeData[collection] = [];
  }

  // Ensure record has the primary key
  let newRecord = { ...record };
  if (newRecord[primaryKey] === undefined) {
    newRecord = {
      ...newRecord,
      [primaryKey]: generateId(storeData[collection], primaryKey),
    };
  }

  // Find record index
  const index = storeData[collection].findIndex(
    (r) => r[primaryKey] === newRecord[primaryKey],
  );

  // Update or add record
  if (index >= 0) {
    storeData[collection][index] = cloneDeep(newRecord);
  } else {
    storeData[collection].push(cloneDeep(newRecord));
  }

  return ok(cloneDeep(newRecord));
};
