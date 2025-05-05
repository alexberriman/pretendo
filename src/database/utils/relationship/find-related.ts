import { DbRecord, QueryOptions, Result, ok } from "../../../types/index.js";
import { cloneDeep } from "lodash-es";
import { applyFilters } from "../filter/apply-filters.js";
import { applySorting } from "../sort/apply-sorting.js";
import { applyPagination } from "../pagination/apply-pagination.js";
import { selectFields } from "../fields/select-fields.js";

/**
 * Finds records in a related collection based on a foreign key relationship
 */
export const findRelated = (
  storeData: Record<string, DbRecord[]>,
  collection: string,
  id: string | number,
  relatedCollection: string,
  foreignKey: string,
  queryOptions?: QueryOptions,
  primaryKey: string = "id",
): Result<DbRecord[], Error> => {
  // Auto-create collections if they don't exist
  if (!storeData[collection]) {
    storeData[collection] = [];
    return ok([]); // No source records to find related records for
  }

  if (!storeData[relatedCollection]) {
    storeData[relatedCollection] = [];
    return ok([]); // No related records in an empty collection
  }

  // Check if the source record exists
  const sourceRecord = storeData[collection].find((r) => r[primaryKey] === id);
  if (!sourceRecord) {
    return ok([]); // Source record not found, return empty array instead of error
  }

  // Find related records
  let relatedRecords = storeData[relatedCollection].filter(
    (r) => r[foreignKey] === id,
  );

  // Apply query options
  if (queryOptions) {
    // Apply filters
    if (queryOptions.filters) {
      relatedRecords = applyFilters(relatedRecords, queryOptions.filters);
    }

    // Apply sorting
    if (queryOptions.sort) {
      relatedRecords = applySorting(relatedRecords, queryOptions.sort);
    }

    // Apply pagination
    if (queryOptions.page !== undefined && queryOptions.perPage !== undefined) {
      relatedRecords = applyPagination(
        relatedRecords,
        queryOptions.page,
        queryOptions.perPage,
      );
    }

    // Apply field selection
    if (queryOptions.fields) {
      relatedRecords = selectFields(
        relatedRecords,
        queryOptions.fields,
      ) as DbRecord[];
    }
  }

  return ok(cloneDeep(relatedRecords));
};
