import { ResourceOperation, Result, err, ok } from "../../types/index.js";
import { PersistenceManager } from "../persistence.js";
import { Store } from "../../types/index.js";
import { RelationshipExpander } from "../relations.js";
import { getResourcePrimaryKey } from "./resource-key.js";
import { createResourceOperations } from "./resource-operations.js";
import { ApiConfig } from "../../types/index.js";

/**
 * Gets a resource by name and returns its operations
 */
export const getResource = (
  resourceName: string,
  config: ApiConfig,
  store: Store,
  persistenceManager: PersistenceManager,
  relationshipExpander: RelationshipExpander,
): Result<ResourceOperation, Error> => {
  // Verify the resource exists
  const keyResult = getResourcePrimaryKey(resourceName, config);
  if (!keyResult.ok) {
    return err(keyResult.error);
  }

  const primaryKey = keyResult.value;

  const resourceOps = createResourceOperations(
    resourceName,
    primaryKey,
    store,
    persistenceManager,
    relationshipExpander,
  );

  return ok(resourceOps);
};
