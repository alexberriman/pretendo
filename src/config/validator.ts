import { DEFAULT_OPTIONS } from "./defaults.js";
import { ApiConfig, ApiOptions, Resource } from "../types/index.js";
import { Result, err, ok } from "../types/result.js";

const validateResource = (resource: Resource): Result<Resource, Error> => {
  if (!resource.name || typeof resource.name !== "string") {
    return err(new Error(`Resource must have a valid name string`));
  }

  if (!Array.isArray(resource.fields) || resource.fields.length === 0) {
    return err(
      new Error(`Resource '${resource.name}' must have at least one field`),
    );
  }

  // Check for primary key, default to 'id' if not specified
  const primaryKey = resource.primaryKey || "id";

  // Ensure primary key field exists
  const hasPrimaryKey = resource.fields.some(
    (field: { name: string }) => field.name === primaryKey,
  );

  if (!hasPrimaryKey) {
    return err(
      new Error(
        `Resource '${resource.name}' is missing its primary key field '${primaryKey}'`,
      ),
    );
  }

  // Validate relationships if they exist
  if (resource.relationships) {
    for (const relationship of resource.relationships) {
      if (!relationship.resource || typeof relationship.resource !== "string") {
        return err(
          new Error(
            `Relationship in resource '${resource.name}' must specify a target resource`,
          ),
        );
      }

      if (
        !relationship.type ||
        !["belongsTo", "hasOne", "hasMany", "manyToMany"].includes(
          relationship.type,
        )
      ) {
        return err(
          new Error(
            `Relationship in resource '${resource.name}' has invalid type: ${relationship.type}`,
          ),
        );
      }

      if (
        !relationship.foreignKey ||
        typeof relationship.foreignKey !== "string"
      ) {
        return err(
          new Error(
            `Relationship in resource '${resource.name}' must specify a foreignKey`,
          ),
        );
      }

      if (relationship.type === "manyToMany" && !relationship.through) {
        return err(
          new Error(
            `Many-to-many relationship in resource '${resource.name}' must specify a 'through' property`,
          ),
        );
      }
    }
  }

  return ok(resource);
};

export const mergeConfig = (config: ApiConfig): Result<ApiConfig, Error> => {
  if (
    !config.resources ||
    !Array.isArray(config.resources) ||
    config.resources.length === 0
  ) {
    return err(new Error("Configuration must include at least one resource"));
  }

  // Validate each resource
  for (const resource of config.resources) {
    const resourceResult = validateResource(resource);
    if (!resourceResult.ok) {
      return resourceResult;
    }
  }

  // Check for duplicate resource names
  const resourceNames = new Set<string>();
  for (const resource of config.resources) {
    if (resourceNames.has(resource.name)) {
      return err(new Error(`Duplicate resource name: ${resource.name}`));
    }
    resourceNames.add(resource.name);
  }

  // Check for valid relationships (references to existing resources)
  for (const resource of config.resources) {
    if (resource.relationships) {
      for (const rel of resource.relationships) {
        if (!resourceNames.has(rel.resource)) {
          return err(
            new Error(
              `Resource '${resource.name}' has relationship to non-existent resource '${rel.resource}'`,
            ),
          );
        }
      }
    }
  }

  // Merge options with defaults
  const mergedOptions: ApiOptions = {
    ...DEFAULT_OPTIONS,
    ...config.options,
  };

  // Auth config merging
  if (config.options?.auth) {
    mergedOptions.auth = {
      ...DEFAULT_OPTIONS.auth,
      ...config.options.auth,
    };
  }

  // Latency config merging
  if (config.options?.latency) {
    mergedOptions.latency = {
      ...DEFAULT_OPTIONS.latency,
      ...config.options.latency,
    };
  }

  // Error simulation config merging
  if (config.options?.errorSimulation) {
    mergedOptions.errorSimulation = {
      ...DEFAULT_OPTIONS.errorSimulation,
      ...config.options.errorSimulation,
    };
  }

  return ok({
    resources: config.resources,
    options: mergedOptions,
    data: config.data || {},
  });
};
