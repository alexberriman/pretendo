import { DbRecord, QueryOptions, Result, ok } from "../../../types/index.js";
import { cloneDeep } from "lodash-es";
import { applyFilters } from "../filter/apply-filters.js";
import { applySorting } from "../sort/apply-sorting.js";
import { applyPagination } from "../pagination/apply-pagination.js";
import { selectFields } from "../fields/select-fields.js";

/**
 * Performs a query on a collection with filtering, sorting, pagination, and field selection
 */
export const query = (
  storeData: Record<string, DbRecord[]>,
  collection: string,
  options?: QueryOptions,
): Result<DbRecord[], Error> => {
  // Auto-create collection if it doesn't exist
  if (!storeData[collection]) {
    storeData[collection] = [];
  }

  let records = cloneDeep(storeData[collection]);

  if (options) {
    // Apply filters
    if (options.filters) {
      records = applyFilters(records, options.filters);
    }

    // Apply sorting
    if (options.sort) {
      records = applySorting(records, options.sort);
    }

    // Apply pagination
    if (options.page !== undefined && options.perPage !== undefined) {
      records = applyPagination(records, options.page, options.perPage);
    }

    // Apply field selection
    if (options.fields) {
      records = selectFields(records, options.fields) as DbRecord[];
    }
  }

  return ok(records);
};
