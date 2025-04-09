import {
  ApiConfig,
  DbRecord,
  QueryFilter,
  QueryOptions,
  QuerySort,
  ReadonlyDeep,
  Result,
  err,
  ok,
} from "../types/index.js";
import { cloneDeep } from "lodash-es";

export type Store = {
  getData: (
    collection?: string,
  ) => Record<string, DbRecord[]> | Result<DbRecord[], Error>;
  getCollection: (name: string) => Result<DbRecord[], Error>;
  getRecord: (
    collection: string,
    id: string | number,
    primaryKey?: string,
  ) => Result<DbRecord | null, Error>;
  setRecord: (
    collection: string,
    record: DbRecord,
    primaryKey?: string,
  ) => Result<DbRecord, Error>;
  addRecord: (
    collection: string,
    record: DbRecord,
    primaryKey?: string,
  ) => Result<DbRecord, Error>;
  updateRecord: (
    collection: string,
    id: string | number,
    data: Partial<DbRecord>,
    primaryKey?: string,
    merge?: boolean,
  ) => Result<DbRecord | null, Error>;
  deleteRecord: (
    collection: string,
    id: string | number,
    primaryKey?: string,
    cascadeRelationships?: Array<{ collection: string; foreignKey: string }>,
  ) => Result<boolean, Error>;
  findRelated: (
    collection: string,
    id: string | number,
    relatedCollection: string,
    foreignKey: string,
    queryOptions?: QueryOptions,
    primaryKey?: string,
  ) => Result<DbRecord[], Error>;
  query: (
    collection: string,
    options?: QueryOptions,
  ) => Result<DbRecord[], Error>;
  reset: (data: Record<string, DbRecord[]>) => Result<void, Error>;
};

// Utility functions for filtering records
const applyFilter = (record: DbRecord, filter: QueryFilter): boolean => {
  const { field, operator, value, caseSensitive = true } = filter;
  const recordValue = record[field];

  // Handle undefined or null values
  if (recordValue === undefined || recordValue === null) {
    return ["eq", "in"].includes(operator) ? false : true;
  }

  let fieldValue = recordValue;
  let compareValue = value;

  // Handle case insensitivity for string comparisons
  if (typeof fieldValue === "string" && !caseSensitive) {
    fieldValue = (fieldValue as string).toLowerCase();
    if (typeof compareValue === "string") {
      compareValue = compareValue.toLowerCase();
    } else if (Array.isArray(compareValue)) {
      compareValue = compareValue.map((v) =>
        typeof v === "string" ? v.toLowerCase() : v,
      );
    }
  }

  switch (operator) {
    case "eq":
      return fieldValue === compareValue;
    case "ne":
      return fieldValue !== compareValue;
    case "gt":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue > compareValue
      );
    case "gte":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue >= compareValue
      );
    case "lt":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue < compareValue
      );
    case "lte":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue <= compareValue
      );
    case "in":
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);
    case "nin":
      return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
    case "contains":
      return (
        typeof fieldValue === "string" &&
        typeof compareValue === "string" &&
        fieldValue.includes(compareValue)
      );
    case "startsWith":
      return (
        typeof fieldValue === "string" &&
        typeof compareValue === "string" &&
        fieldValue.startsWith(compareValue)
      );
    case "endsWith":
      return (
        typeof fieldValue === "string" &&
        typeof compareValue === "string" &&
        fieldValue.endsWith(compareValue)
      );
    default:
      return false;
  }
};

// Apply sorting to a collection
const applySorting = (records: DbRecord[], sorts: QuerySort[]): DbRecord[] => {
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

// Apply pagination to a collection
const applyPagination = (
  records: DbRecord[],
  page: number = 1,
  perPage: number = 10,
): DbRecord[] => {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return records.slice(start, end);
};

// Filter records by a set of filters
const applyFilters = (
  records: DbRecord[],
  filters?: QueryFilter[],
): DbRecord[] => {
  if (!filters || filters.length === 0) return records;

  return records.filter((record) => {
    return filters.every((filter) => applyFilter(record, filter));
  });
};

// Apply field selection (partial response)
const selectFields = (records: DbRecord[], fields?: string[]): DbRecord[] => {
  if (!fields || fields.length === 0) return records;

  return records.map((record) => {
    const newRecord: DbRecord = {};
    fields.forEach((field) => {
      if (record[field] !== undefined) {
        newRecord[field] = record[field];
      }
    });
    return newRecord;
  });
};

// Create a new in-memory store
export const createStore = (initialData: ReadonlyDeep<ApiConfig>): Store => {
  // Deep clone initial data to avoid mutations
  let data: Record<string, DbRecord[]> = {};

  // Initialize collections from resources
  initialData.resources.forEach((resource) => {
    data[resource.name] = [];
  });

  // Load initial data if provided
  if (initialData.data) {
    for (const [collection, records] of Object.entries(initialData.data)) {
      if (Array.isArray(records)) {
        data[collection] = cloneDeep(records);
      }
    }
  }

  // Get primary key for a collection
  const getPrimaryKey = (collection: string): string => {
    const resource = initialData.resources.find((r) => r.name === collection);
    return resource?.primaryKey || "id";
  };

  // Generate a new ID for a record
  const generateId = (collection: string): number => {
    const records = data[collection];
    const primaryKey = getPrimaryKey(collection);

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

  return {
    getData: (collection?: string) => {
      if (collection) {
        if (!data[collection]) {
          return err(new Error(`Collection '${collection}' does not exist`));
        }
        return ok(cloneDeep(data[collection]));
      }
      return cloneDeep(data);
    },

    getCollection: (name: string): Result<DbRecord[], Error> => {
      if (!data[name]) {
        return err(new Error(`Collection '${name}' does not exist`));
      }
      return ok(cloneDeep(data[name]));
    },

    getRecord: (
      collection: string,
      id: string | number,
      primaryKey: string = getPrimaryKey(collection),
    ): Result<DbRecord | null, Error> => {
      if (!data[collection]) {
        return err(new Error(`Collection '${collection}' does not exist`));
      }

      const record = data[collection].find((r) => r[primaryKey] === id);
      return ok(record ? cloneDeep(record) : null);
    },

    setRecord: (
      collection: string,
      record: DbRecord,
      primaryKey: string = getPrimaryKey(collection),
    ): Result<DbRecord, Error> => {
      if (!data[collection]) {
        return err(new Error(`Collection '${collection}' does not exist`));
      }

      // Ensure record has the primary key
      if (record[primaryKey] === undefined) {
        record = { ...record, [primaryKey]: generateId(collection) };
      }

      // Find record index
      const index = data[collection].findIndex(
        (r) => r[primaryKey] === record[primaryKey],
      );

      // Update or add record
      if (index >= 0) {
        data[collection][index] = cloneDeep(record);
      } else {
        data[collection].push(cloneDeep(record));
      }

      return ok(cloneDeep(record));
    },

    addRecord: (
      collection: string,
      record: DbRecord,
      primaryKey: string = getPrimaryKey(collection),
    ): Result<DbRecord, Error> => {
      if (!data[collection]) {
        return err(new Error(`Collection '${collection}' does not exist`));
      }

      // Ensure record has the primary key
      const newRecord = { ...record };
      if (newRecord[primaryKey] === undefined) {
        newRecord[primaryKey] = generateId(collection);
      } else {
        // Check for duplicate ID
        const existingRecord = data[collection].find(
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

      data[collection].push(cloneDeep(newRecord));
      return ok(cloneDeep(newRecord));
    },

    updateRecord: (
      collection: string,
      id: string | number,
      updateData: Partial<DbRecord>,
      primaryKey: string = getPrimaryKey(collection),
      merge: boolean = true,
    ): Result<DbRecord | null, Error> => {
      if (!data[collection]) {
        return err(new Error(`Collection '${collection}' does not exist`));
      }

      const index = data[collection].findIndex((r) => r[primaryKey] === id);
      if (index < 0) {
        return ok(null);
      }

      // Create updated record - either merge or replace
      const currentRecord = data[collection][index];
      const updatedRecord = merge
        ? { ...currentRecord, ...updateData, [primaryKey]: id } // Preserve ID on merge
        : { ...updateData, [primaryKey]: id }; // Always include ID on replace

      data[collection][index] = cloneDeep(updatedRecord);
      return ok(cloneDeep(updatedRecord));
    },

    deleteRecord: (
      collection: string,
      id: string | number,
      primaryKey: string = getPrimaryKey(collection),
      cascadeRelationships?: Array<{ collection: string; foreignKey: string }>,
    ): Result<boolean, Error> => {
      if (!data[collection]) {
        return err(new Error(`Collection '${collection}' does not exist`));
      }

      const index = data[collection].findIndex((r) => r[primaryKey] === id);
      if (index < 0) {
        return ok(false);
      }

      // Handle cascade deletes
      if (cascadeRelationships && cascadeRelationships.length > 0) {
        for (const rel of cascadeRelationships) {
          if (!data[rel.collection]) {
            return err(
              new Error(
                `Related collection '${rel.collection}' does not exist`,
              ),
            );
          }

          // Delete all related records
          data[rel.collection] = data[rel.collection].filter(
            (r) => r[rel.foreignKey] !== id,
          );
        }
      }

      // Delete the record
      data[collection].splice(index, 1);
      return ok(true);
    },

    findRelated: (
      collection: string,
      id: string | number,
      relatedCollection: string,
      foreignKey: string,
      queryOptions?: QueryOptions,
      primaryKey: string = getPrimaryKey(collection),
    ): Result<DbRecord[], Error> => {
      if (!data[collection]) {
        return err(new Error(`Collection '${collection}' does not exist`));
      }

      if (!data[relatedCollection]) {
        return err(
          new Error(`Related collection '${relatedCollection}' does not exist`),
        );
      }

      // Check if the source record exists
      const sourceRecord = data[collection].find((r) => r[primaryKey] === id);
      if (!sourceRecord) {
        return err(
          new Error(
            `Record with ${primaryKey}=${id} not found in '${collection}'`,
          ),
        );
      }

      // Find related records
      let relatedRecords = data[relatedCollection].filter(
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
        if (
          queryOptions.page !== undefined &&
          queryOptions.perPage !== undefined
        ) {
          relatedRecords = applyPagination(
            relatedRecords,
            queryOptions.page,
            queryOptions.perPage,
          );
        }

        // Apply field selection
        if (queryOptions.fields) {
          relatedRecords = selectFields(relatedRecords, queryOptions.fields);
        }
      }

      return ok(cloneDeep(relatedRecords));
    },

    query: (
      collection: string,
      options?: QueryOptions,
    ): Result<DbRecord[], Error> => {
      if (!data[collection]) {
        return err(new Error(`Collection '${collection}' does not exist`));
      }

      let records = cloneDeep(data[collection]);

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
          records = selectFields(records, options.fields);
        }
      }

      return ok(records);
    },

    reset: (newData: Record<string, DbRecord[]>): Result<void, Error> => {
      data = cloneDeep(newData);
      return ok(undefined);
    },
  };
};
