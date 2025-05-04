import { ApiConfig, Result, err, ok } from "../../types/index.js";

/**
 * Gets the primary key for a resource
 */
export const getResourcePrimaryKey = (
  resourceName: string,
  config: ApiConfig,
): Result<string, Error> => {
  const resource = config.resources.find((r) => r.name === resourceName);
  if (!resource) {
    return err(new Error(`Resource '${resourceName}' not found`));
  }
  return ok(resource.primaryKey || "id");
};
