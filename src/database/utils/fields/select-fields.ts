import { DbRecord } from "../../../types/index.js";
import { cloneDeep } from "lodash-es";

/**
 * Selects specific fields from a record or records to return partial responses
 */
export const selectFields = (
  recordOrRecords: DbRecord | DbRecord[],
  fields?: string[],
): DbRecord | DbRecord[] => {
  if (!fields || fields.length === 0) return cloneDeep(recordOrRecords);

  // Handle single record
  if (!Array.isArray(recordOrRecords)) {
    const newRecord: DbRecord = {};
    fields.forEach((field) => {
      if (recordOrRecords[field] !== undefined) {
        newRecord[field] = cloneDeep(recordOrRecords[field]);
      }
    });
    return newRecord;
  }

  // Handle array of records
  return recordOrRecords.map((record) => {
    const newRecord: DbRecord = {};
    fields.forEach((field) => {
      if (record[field] !== undefined) {
        newRecord[field] = cloneDeep(record[field]);
      }
    });
    return newRecord;
  });
};
