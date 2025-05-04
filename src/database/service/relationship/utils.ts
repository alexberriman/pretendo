import {
  ApiConfig,
  Relationship,
  Result,
  err,
  ok,
} from "../../../types/index.js";

/**
 * Get primary key for a resource
 */
export const getPrimaryKey = (
  config: ApiConfig,
  resourceName: string,
): string => {
  const resource = config.resources.find(
    (r: { name: string }) => r.name === resourceName,
  );
  return resource?.primaryKey || "id";
};

/**
 * Get relationships for a resource
 */
export const getRelationships = (
  config: ApiConfig,
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

/**
 * Find a specific relationship
 */
export const findRelationship = (
  config: ApiConfig,
  resourceName: string,
  relationshipName: string,
): Result<Relationship, Error> => {
  const relationshipsResult = getRelationships(config, resourceName);

  if (!relationshipsResult.ok) {
    return err(relationshipsResult.error);
  }

  const relationship = relationshipsResult.value.find(
    (r) => r.resource === relationshipName || r.foreignKey === relationshipName,
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
