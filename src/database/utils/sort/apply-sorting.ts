import { DbRecord, QuerySort } from "../../../types/index.js";

/**
 * Applies sorting to a collection of records based on sort criteria
 */
export const applySorting = (
  records: DbRecord[],
  sorts: QuerySort[],
): DbRecord[] => {
  if (!sorts || sorts.length === 0) return records;

  return [...records].sort((a, b) => {
    for (const sort of sorts) {
      const { field, order } = sort;
      const aValue = a[field];
      const bValue = b[field];

      // Handle undefined or null values
      if (aValue === undefined || aValue === null) {
        return order === "asc" ? -1 : 1;
      }
      if (bValue === undefined || bValue === null) {
        return order === "asc" ? 1 : -1;
      }

      if (aValue < bValue) {
        return order === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return order === "asc" ? 1 : -1;
      }
    }
    return 0;
  });
};
