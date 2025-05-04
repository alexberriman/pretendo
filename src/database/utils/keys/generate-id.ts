import { DbRecord } from "../../../types/index.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Determines if a resource uses UUID as the primary key type
 */
export const isUuidPrimaryKey = (
  records: DbRecord[],
  primaryKey: string = "id",
): boolean => {
  if (!records || records.length === 0) {
    return false;
  }

  // Check if any existing record has a UUID-format primary key
  return records.some((record) => {
    const id = record[primaryKey];
    return (
      typeof id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id as string,
      )
    );
  });
};

/**
 * Generates a new ID for a record
 * - For numeric IDs: finds the maximum ID and increments it
 * - For UUID fields: generates a new UUID v4
 */
export const generateId = (
  records: DbRecord[],
  primaryKey: string = "id",
): string | number => {
  // Check if this collection uses UUIDs
  if (isUuidPrimaryKey(records, primaryKey)) {
    return uuidv4();
  }

  // Fall back to numeric ID generation
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
