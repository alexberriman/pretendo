import { Resource } from "../../../types/index.js";
import { OpenAPISchema } from "../types/index.js";
import { generateFieldSchema } from "./field-schema.js";

/**
 * Generate a schema for a resource
 */
export const generateResourceSchema = (resource: Resource): OpenAPISchema => {
  const schema: OpenAPISchema = {
    type: "object",
    properties: {},
    required: [],
  };

  for (const field of resource.fields) {
    if (!schema.properties) {
      schema.properties = {};
    }
    schema.properties[field.name] = generateFieldSchema(field);

    if (field.required) {
      if (!schema.required) {
        schema.required = [];
      }
      schema.required.push(field.name);
    }
  }

  if (schema.required && schema.required.length === 0) {
    delete schema.required;
  }

  return schema;
};
