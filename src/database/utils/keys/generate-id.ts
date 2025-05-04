import { DbRecord } from "../../../types/index.js";

/**
 * Generates a new ID for a record by finding the maximum ID and incrementing
 */
export const generateId = (
  records: DbRecord[],
  primaryKey: string = "id",
): number => {
  if (!records || records.length === 0) {
    return 1;
  }

  // Find maximum ID and increment
  const maxId = Math.max(
    ...records
      .map((record) => {
        const id = record[primaryKey];
        return typeof id === "number" ? id : 0;
      })
      .filter((id) => typeof id === "number"),
  );

  return maxId + 1;
};
