import { DbRecord } from "../../../types/index.js";
import { cloneDeep } from "lodash-es";

/**
 * Selects specific fields from records to return partial responses
 */
export const selectFields = (
  records: DbRecord[],
  fields?: string[],
): DbRecord[] => {
  if (!fields || fields.length === 0) return cloneDeep(records);

  return records.map((record) => {
    const newRecord: DbRecord = {};
    fields.forEach((field) => {
      if (record[field] !== undefined) {
        newRecord[field] = cloneDeep(record[field]);
      }
    });
    return newRecord;
  });
};
