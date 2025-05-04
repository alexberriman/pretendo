import { DbRecord, QueryFilter } from "../../../types/index.js";
import { applyFilter } from "./apply-filter.js";

/**
 * Filters a collection of records based on an array of filters
 * All filters must match for a record to be included (AND logic)
 */
export const applyFilters = (
  records: DbRecord[],
  filters?: QueryFilter[],
): DbRecord[] => {
  if (!filters || filters.length === 0) return records;

  return records.filter((record) => {
    return filters.every((filter) => applyFilter(record, filter));
  });
};
