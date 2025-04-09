import {
  ApiConfig,
  DbRecord,
  QueryOptions,
  Relationship,
  Result,
  err,
  ok,
} from "../types/index.js";
import { Store } from "./store.js";

export type RelationshipExpander = {
  expandRelationships: (
    collection: string,
    records: DbRecord[],
    expandPaths: string[],
  ) => Result<DbRecord[], Error>;
  getRelationships: (collection: string) => Result<Relationship[], Error>;
  findRelatedRecords: (
    collection: string,
    id: string | number,
    relationship: string,
    options?: QueryOptions,
  ) => Result<DbRecord[], Error>;
};

export const createRelationshipExpander = (
  config: ApiConfig,
  store: Store,
): RelationshipExpander => {
  // Get primary key for a resource
  const getPrimaryKey = (resourceName: string): string => {
    const resource = config.resources.find(
      (r: { name: string }) => r.name === resourceName,
    );
    return resource?.primaryKey || "id";
  };

  // Get relationships for a resource
  const getRelationships = (
    resourceName: string,
  ): Result<Relationship[], Error> => {
    const resource = config.resources.find(
      (r: { name: string }) => r.name === resourceName,
    );

    if (!resource) {
      return err(new Error(`Resource '${resourceName}' not found`));
    }

    return ok(resource.relationships || []);
  };

  // Find a specific relationship
  const findRelationship = (
    resourceName: string,
    relationshipName: string,
  ): Result<Relationship, Error> => {
    const relationshipsResult = getRelationships(resourceName);

    if (!relationshipsResult.ok) {
      return err(relationshipsResult.error);
    }

    const relationship = relationshipsResult.value.find(
      (r) =>
        r.resource === relationshipName || r.foreignKey === relationshipName,
    );

    if (!relationship) {
      return err(
        new Error(
          `Relationship '${relationshipName}' not found for resource '${resourceName}'`,
        ),
      );
    }

    return ok(relationship);
  };

  // Expand a single level of relationships
  const expandSingleLevel = (
    collection: string,
    records: DbRecord[],
    relationshipName: string,
  ): Result<DbRecord[], Error> => {
    // Find the relationship
    const relationshipResult = findRelationship(collection, relationshipName);

    if (!relationshipResult.ok) {
      return err(relationshipResult.error);
    }

    const relationship = relationshipResult.value;
    const relatedCollection = relationship.resource;
    const foreignKey = relationship.foreignKey;
    const primaryKey = getPrimaryKey(collection);
    const targetKey =
      relationship.targetKey || getPrimaryKey(relatedCollection);

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
            (r) => r[foreignKey] === recordId,
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
          const match = relatedRecords.find((r) => r[targetKey] === foreignId);

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
            (j) => j[foreignKey] === recordId,
          );

          // Get target IDs
          const targetIds = joinRecords.map((j) => j[targetKey]);

          // Find related records with matching IDs
          const matches = relatedRecords.filter((r) => {
            const relatedId = r[getPrimaryKey(relatedCollection)];
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

  // Expand nested relationships (e.g., "author.profile")
  const expandNestedRelationships = (
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
      return expandSingleLevel(collection, records, segments[0]);
    }

    // Recursive case: expand the first segment, then expand nested paths on the expanded records
    const firstSegment = segments[0];
    const expandFirstResult = expandSingleLevel(
      collection,
      records,
      firstSegment,
    );

    if (!expandFirstResult.ok) {
      return expandFirstResult;
    }

    const expandedRecords = expandFirstResult.value;

    // Get the relationship details to determine the next collection
    const relationshipResult = findRelationship(collection, firstSegment);

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
                r[getPrimaryKey(nextCollection)] ===
                related[i][getPrimaryKey(nextCollection)],
            );

            if (expandedRelated) {
              related[i] = expandedRelated;
            }
          }
        } else if (related && typeof related === "object") {
          // Update single related record
          const expandedRelated = nestedExpandResult.value.find(
            (r: DbRecord) =>
              r[getPrimaryKey(nextCollection)] ===
              (related as DbRecord)[getPrimaryKey(nextCollection)],
          );

          if (expandedRelated) {
            record[firstSegment] = expandedRelated;
          }
        }
      }
    }

    return ok(expandedRecords);
  };

  // Expand multiple relationships
  const expandRelationships = (
    collection: string,
    records: DbRecord[],
    expandPaths: string[],
  ): Result<DbRecord[], Error> => {
    if (!expandPaths || expandPaths.length === 0) {
      return ok(records);
    }

    let expandedRecords = [...records];

    // Process each expand path
    for (const path of expandPaths) {
      const expandResult = expandNestedRelationships(
        collection,
        expandedRecords,
        path,
      );

      if (!expandResult.ok) {
        return expandResult;
      }

      expandedRecords = expandResult.value;
    }

    return ok(expandedRecords);
  };

  // Find related records with query options
  const findRelatedRecords = (
    collection: string,
    id: string | number,
    relationshipName: string,
    options?: QueryOptions,
  ): Result<DbRecord[], Error> => {
    // Find the relationship definition
    const relationshipResult = findRelationship(collection, relationshipName);

    if (!relationshipResult.ok) {
      return err(relationshipResult.error);
    }

    const relationship = relationshipResult.value;
    const relatedCollection = relationship.resource;
    const foreignKey = relationship.foreignKey;
    const primaryKey = getPrimaryKey(collection);
    const targetKey =
      relationship.targetKey || getPrimaryKey(relatedCollection);

    // Check if the source record exists
    const recordResult = store.getRecord(collection, id, primaryKey);

    if (!recordResult.ok) {
      return err(recordResult.error);
    }

    if (!recordResult.value) {
      return err(
        new Error(
          `Record with ${primaryKey}=${id} not found in '${collection}'`,
        ),
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
            new Error(
              `Many-to-many relationship requires a 'through' property`,
            ),
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
          field: getPrimaryKey(relatedCollection),
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

  return {
    expandRelationships,
    getRelationships,
    findRelatedRecords,
  };
};
