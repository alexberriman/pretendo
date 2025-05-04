import { DbRecord } from "../../../types/index.js";

/**
 * Applies pagination to a collection of records
 */
export const applyPagination = (
  records: DbRecord[],
  page: number = 1,
  perPage: number = 10,
): DbRecord[] => {
  // Handle edge cases for page
  if (page <= 0) {
    page = 1;
  }

  const start = (page - 1) * perPage;
  const end = start + perPage;
  return records.slice(start, end);
};
