import { ApiConfig, Store } from "../../../types/index.js";
import { RelationshipExpander } from "./types.js";
import { expandRelationships } from "./expand-relationships.js";
import { findRelatedRecords } from "./find-related-records.js";
import { getRelationships } from "./utils.js";

/**
 * Creates a relationship expander service for handling relationships between resources
 */
export const createRelationshipExpander = (
  config: ApiConfig,
  store: Store,
): RelationshipExpander => {
  return {
    expandRelationships: (collection, records, expandPaths) =>
      expandRelationships(config, store, collection, records, expandPaths),

    getRelationships: (collection) => getRelationships(config, collection),

    findRelatedRecords: (collection, id, relationship, options) =>
      findRelatedRecords(config, store, collection, id, relationship, options),
  };
};

// Re-export types
export * from "./types.js";
