import {
  ApiConfig,
  DbRecord,
  Result,
  Store,
  err,
  ok,
} from "../../../types/index.js";
import { expandSingleLevel } from "./expand-single-level.js";
import { findRelationship, getPrimaryKey } from "./utils.js";

/**
 * Expand nested relationships (e.g., "author.profile")
 */
export const expandNestedRelationships = (
  config: ApiConfig,
  store: Store,
  collection: string,
  records: DbRecord[],
  path: string,
  maxDepth: number = 3,
): Result<DbRecord[], Error> => {
  // Split path into segments (e.g., "author.profile" -> ["author", "profile"])
  const segments = path.split(".");

  if (segments.length > maxDepth) {
    return err(
      new Error(`Expansion depth exceeds maximum (${maxDepth}): ${path}`),
    );
  }

  if (segments.length === 1) {
    // Base case: expand a single relationship
    return expandSingleLevel(config, store, collection, records, segments[0]);
  }

  // Recursive case: expand the first segment, then expand nested paths on the expanded records
  const firstSegment = segments[0];
  const expandFirstResult = expandSingleLevel(
    config,
    store,
    collection,
    records,
    firstSegment,
  );

  if (!expandFirstResult.ok) {
    return expandFirstResult;
  }

  const expandedRecords = expandFirstResult.value;

  // Get the relationship details to determine the next collection
  const relationshipResult = findRelationship(config, collection, firstSegment);

  if (!relationshipResult.ok) {
    return err(relationshipResult.error);
  }

  const nextCollection = relationshipResult.value.resource;
  const nestedPath = segments.slice(1).join(".");

  // Extract all related records that need further expansion
  const relatedRecordsToExpand: DbRecord[] = [];

  for (const record of expandedRecords) {
    const related = record[firstSegment];

    if (Array.isArray(related)) {
      relatedRecordsToExpand.push(...related);
    } else if (related && typeof related === "object") {
      relatedRecordsToExpand.push(related as DbRecord);
    }
  }

  // Expand the nested path on the related records
  if (relatedRecordsToExpand.length > 0) {
    const nestedExpandResult = expandNestedRelationships(
      config,
      store,
      nextCollection,
      relatedRecordsToExpand,
      nestedPath,
      maxDepth - 1,
    );

    if (!nestedExpandResult.ok) {
      return nestedExpandResult;
    }

    // Update the expanded records in place
    for (const record of expandedRecords) {
      const related = record[firstSegment];

      if (Array.isArray(related)) {
        // Update array of related records
        for (let i = 0; i < related.length; i++) {
          const expandedRelated = nestedExpandResult.value.find(
            (r: DbRecord) =>
              r[getPrimaryKey(config, nextCollection)] ===
              related[i][getPrimaryKey(config, nextCollection)],
          );

          if (expandedRelated) {
            related[i] = expandedRelated;
          }
        }
      } else if (related && typeof related === "object") {
        // Update single related record
        const expandedRelated = nestedExpandResult.value.find(
          (r: DbRecord) =>
            r[getPrimaryKey(config, nextCollection)] ===
            (related as DbRecord)[getPrimaryKey(config, nextCollection)],
        );

        if (expandedRelated) {
          record[firstSegment] = expandedRelated;
        }
      }
    }
  }

  return ok(expandedRecords);
};
