import {
  ApiConfig,
  DbRecord,
  QueryOptions,
  ReadonlyDeep,
  Store,
} from "../types/index.js";
import { cloneDeep } from "lodash-es";
import {
  getPrimaryKey,
  getData,
  getCollection,
  resetStore,
  getRecord,
  setRecord,
  addRecord,
  updateRecord,
  deleteRecord,
  findRelated,
  query,
} from "./utils/index.js";

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
        // Create collection if it doesn't exist yet (which may happen if the collection
        // is referenced in relationships but not explicitly defined in resources)
        if (!data[collection]) {
          data[collection] = [];
        }
        data[collection] = cloneDeep(records);
      }
    }
  }

  // Get primary key for a collection helper function
  const getPrimaryKeyForStore = (collection: string): string => {
    // Cast to Pick<ApiConfig, "resources"> to match the expected type
    const configWithResources = {
      resources: initialData.resources,
    } as Pick<ApiConfig, "resources">;
    return getPrimaryKey(collection, configWithResources);
  };

  return {
    getData: (collection?: string) => {
      return getData(data, collection);
    },

    getCollection: (name: string) => {
      return getCollection(data, name);
    },

    getRecord: (
      collection: string,
      id: string | number,
      primaryKey?: string,
    ) => {
      return getRecord(
        data,
        collection,
        id,
        primaryKey || getPrimaryKeyForStore(collection),
      );
    },

    setRecord: (collection: string, record: DbRecord, primaryKey?: string) => {
      return setRecord(
        data,
        collection,
        record,
        primaryKey || getPrimaryKeyForStore(collection),
      );
    },

    addRecord: (collection: string, record: DbRecord, primaryKey?: string) => {
      return addRecord(
        data,
        collection,
        record,
        primaryKey || getPrimaryKeyForStore(collection),
      );
    },

    updateRecord: (
      collection: string,
      id: string | number,
      updateData: Partial<DbRecord>,
      primaryKey?: string,
      merge?: boolean,
    ) => {
      return updateRecord(
        data,
        collection,
        id,
        updateData,
        primaryKey || getPrimaryKeyForStore(collection),
        merge,
      );
    },

    deleteRecord: (
      collection: string,
      id: string | number,
      primaryKey?: string,
      cascadeRelationships?: Array<{ collection: string; foreignKey: string }>,
    ) => {
      return deleteRecord(
        data,
        collection,
        id,
        primaryKey || getPrimaryKeyForStore(collection),
        cascadeRelationships,
      );
    },

    findRelated: (
      collection: string,
      id: string | number,
      relatedCollection: string,
      foreignKey: string,
      queryOptions?: QueryOptions,
      primaryKey?: string,
    ) => {
      return findRelated(
        data,
        collection,
        id,
        relatedCollection,
        foreignKey,
        queryOptions,
        primaryKey || getPrimaryKeyForStore(collection),
      );
    },

    query: (collection: string, options?: QueryOptions) => {
      return query(data, collection, options);
    },

    reset: (newData: Record<string, DbRecord[]>) => {
      data = cloneDeep(newData);
      return resetStore(newData);
    },
  };
};
