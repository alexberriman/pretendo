import { ApiConfig, Resource, Result, err, ok } from "../../types/index.js";

/**
 * Gets a resource configuration by name
 */
export const getResourceConfig = (
  resourceName: string,
  config: ApiConfig,
): Result<Resource, Error> => {
  const resource = config.resources.find((r) => r.name === resourceName);

  if (!resource) {
    return err(new Error(`Resource '${resourceName}' not found`));
  }

  return ok(resource);
};
