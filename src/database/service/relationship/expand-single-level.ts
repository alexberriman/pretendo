import {
  ApiConfig,
  DbRecord,
  Result,
  Store,
  err,
  ok,
} from "../../../types/index.js";
import { findRelationship, getPrimaryKey } from "./utils.js";

/**
 * Expand a single level of relationships
 */
export const expandSingleLevel = (
  config: ApiConfig,
  store: Store,
  collection: string,
  records: DbRecord[],
  relationshipName: string,
): Result<DbRecord[], Error> => {
  // Find the relationship
  const relationshipResult = findRelationship(
    config,
    collection,
    relationshipName,
  );

  if (!relationshipResult.ok) {
    return err(relationshipResult.error);
  }

  const relationship = relationshipResult.value;
  const relatedCollection = relationship.resource;
  const foreignKey = relationship.foreignKey;
  const primaryKey = getPrimaryKey(config, collection);
  const targetKey =
    relationship.targetKey || getPrimaryKey(config, relatedCollection);

  // Get all related records in one query for efficiency
  const relatedRecordsResult = store.getCollection(relatedCollection);

  if (!relatedRecordsResult.ok) {
    return err(relatedRecordsResult.error);
  }

  const relatedRecords = relatedRecordsResult.value;

  // For each record, find and attach its related records
  const expandedRecords = records.map((record) => {
    const recordId = record[primaryKey];
    const newRecord = { ...record };

    switch (relationship.type) {
      case "hasOne":
      case "hasMany": {
        // Find records where foreignKey = recordId
        const matches = relatedRecords.filter(
          (r: DbRecord) => r[foreignKey] === recordId,
        );

        // Attach as array for hasMany, single object for hasOne
        if (relationship.type === "hasMany") {
          newRecord[relationshipName] = matches;
        } else if (matches.length > 0) {
          newRecord[relationshipName] = matches[0];
        }
        break;
      }

      case "belongsTo": {
        // Find the record where targetKey = record[foreignKey]
        const foreignId = record[foreignKey];
        const match = relatedRecords.find(
          (r: DbRecord) => r[targetKey] === foreignId,
        );

        if (match) {
          newRecord[relationshipName] = match;
        }
        break;
      }

      case "manyToMany": {
        if (!relationship.through) {
          return record;
        }

        // Get the join table
        const joinTableResult = store.getCollection(relationship.through);

        if (!joinTableResult.ok) {
          return record;
        }

        const joinTable = joinTableResult.value;

        // Find records in the join table that reference the current record
        const joinRecords = joinTable.filter(
          (j: DbRecord) => j[foreignKey] === recordId,
        );

        // Get target IDs
        const targetIds = joinRecords.map((j: DbRecord) => j[targetKey]);

        // Find related records with matching IDs
        const matches = relatedRecords.filter((r: DbRecord) => {
          const relatedId = r[getPrimaryKey(config, relatedCollection)];
          return targetIds.includes(relatedId);
        });

        newRecord[relationshipName] = matches;
        break;
      }
    }

    return newRecord;
  });

  return ok(expandedRecords);
};
