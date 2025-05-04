import { DbRecord, Result, ok, err } from "../../../types/index.js";
import { cloneDeep } from "lodash-es";
import { generateId } from "../keys/generate-id.js";

/**
 * Adds a new record to a collection
 */
export const addRecord = (
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
  const newRecord = { ...record };
  if (newRecord[primaryKey] === undefined) {
    newRecord[primaryKey] = generateId(storeData[collection], primaryKey);
  } else {
    // Check for duplicate ID
    const existingRecord = storeData[collection].find(
      (r) => r[primaryKey] === newRecord[primaryKey],
    );
    if (existingRecord) {
      return err(
        new Error(
          `Record with ${primaryKey}=${newRecord[primaryKey]} already exists in '${collection}'`,
        ),
      );
    }
  }

  storeData[collection].push(cloneDeep(newRecord));
  return ok(cloneDeep(newRecord));
};
