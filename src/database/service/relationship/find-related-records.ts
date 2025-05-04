import {
  ApiConfig,
  DbRecord,
  QueryOptions,
  Result,
  Store,
  err,
  ok,
} from "../../../types/index.js";
import { findRelationship, getPrimaryKey } from "./utils.js";

/**
 * Find related records with query options
 */
export const findRelatedRecords = (
  config: ApiConfig,
  store: Store,
  collection: string,
  id: string | number,
  relationshipName: string,
  options?: QueryOptions,
): Result<DbRecord[], Error> => {
  // Find the relationship definition
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

  // Check if the source record exists
  const recordResult = store.getRecord(collection, id, primaryKey);

  if (!recordResult.ok) {
    return err(recordResult.error);
  }

  if (!recordResult.value) {
    return err(
      new Error(`Record with ${primaryKey}=${id} not found in '${collection}'`),
    );
  }

  switch (relationship.type) {
    case "hasOne":
    case "hasMany": {
      // Find records where foreignKey = id
      return store.findRelated(
        collection,
        id,
        relatedCollection,
        foreignKey,
        options,
        primaryKey,
      );
    }

    case "belongsTo": {
      // Get the foreign ID from the source record
      const foreignId = recordResult.value[foreignKey];

      if (foreignId === undefined || foreignId === null) {
        return ok([]);
      }

      // Get the related record - ensure it's string or number
      const relatedRecordResult = store.getRecord(
        relatedCollection,
        typeof foreignId === "object"
          ? String(foreignId)
          : (foreignId as string | number),
        targetKey,
      );

      if (!relatedRecordResult.ok) {
        return err(relatedRecordResult.error);
      }

      const relatedRecord = relatedRecordResult.value;

      return ok(relatedRecord ? [relatedRecord] : []);
    }

    case "manyToMany": {
      if (!relationship.through) {
        return err(
          new Error(`Many-to-many relationship requires a 'through' property`),
        );
      }

      // Get records from the join table
      const joinRecordsResult = store.query(relationship.through, {
        filters: [{ field: foreignKey, operator: "eq", value: id }],
      });

      if (!joinRecordsResult.ok) {
        return err(joinRecordsResult.error);
      }

      const joinRecords = joinRecordsResult.value;

      if (joinRecords.length === 0) {
        return ok([]);
      }

      // Get target IDs
      const targetIds = joinRecords.map(
        (record: DbRecord) => record[targetKey],
      );

      // Build filters to include original options
      const filters = options?.filters?.slice() || [];

      // Add filter for target IDs
      filters.push({
        field: getPrimaryKey(config, relatedCollection),
        operator: "in",
        value: targetIds,
      });

      // Query the related records
      return store.query(relatedCollection, {
        ...options,
        filters,
      });
    }

    default:
      return err(
        new Error(`Unsupported relationship type: ${relationship.type}`),
      );
  }
};
