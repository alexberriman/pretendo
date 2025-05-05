import { Resource } from "../../../types/index.js";
import { OpenAPISchema } from "../types/index.js";
import { generateResourceSchema } from "../schemas/index.js";

/**
 * Create additional schemas for request/response models
 */
export const generateAdditionalSchemas = (
  resources: Resource[],
): Record<string, OpenAPISchema> => {
  const schemas: Record<string, OpenAPISchema> = {};

  for (const resource of resources) {
    const name = resource.name;

    // Create the main resource schema
    schemas[name] = generateResourceSchema(resource);

    // Create a schema for creation (omitting auto-generated fields)
    const createSchema = JSON.parse(JSON.stringify(schemas[name]));
    // Remove id field if it's a primary key and auto-generated
    const primaryKey = resource.primaryKey || "id";
    if (createSchema.properties && createSchema.properties[primaryKey]) {
      delete createSchema.properties[primaryKey];
      if (createSchema.required) {
        const index = createSchema.required.indexOf(primaryKey);
        if (index > -1) {
          createSchema.required.splice(index, 1);
        }
      }
    }
    schemas[`${name}Create`] = createSchema;

    // Create a schema for updates
    schemas[`${name}Update`] = createSchema;

    // Create a schema for patch (all fields optional)
    const patchSchema = JSON.parse(JSON.stringify(schemas[name]));
    if (patchSchema.required) {
      delete patchSchema.required;
    }
    schemas[`${name}Patch`] = patchSchema;
  }

  return schemas;
};
