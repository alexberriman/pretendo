import { DbRecord, Result, ok, err } from "../../../types/index.js";
import { ResourceField } from "../../../types/config.js";
import { cloneDeep } from "lodash-es";
import { generateId } from "../keys/generate-id.js";
import { formatValidationErrors, validateRecord } from "../validation/index.js";

/**
 * Adds a new record to a collection
 */
export const addRecord = (
  storeData: Record<string, DbRecord[]>,
  collection: string,
  record: DbRecord,
  primaryKey: string = "id",
  fields?: ResourceField[],
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

  // Validate the record if field definitions are provided
  if (fields && fields.length > 0) {
    const existingRecords = storeData[collection] || [];

    // No debug output in production

    const validationResult = validateRecord(
      newRecord,
      fields,
      collection,
      existingRecords,
    );

    if (!validationResult.ok) {
      const errorMessage = formatValidationErrors(validationResult.error);
      // No debug output in production
      return err(new Error(`Validation failed: ${errorMessage}`));
    }

    // No debug output in production
  }

  storeData[collection].push(cloneDeep(newRecord));
  return ok(cloneDeep(newRecord));
};
