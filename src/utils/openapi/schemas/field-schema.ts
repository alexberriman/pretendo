import { ResourceField } from "../../../types/index.js";
import { OpenAPISchema } from "../types/index.js";
import { mapTypeToOpenApiType } from "../mappers/index.js";

/**
 * Generate an OpenAPI field schema from a resource field
 */
export const generateFieldSchema = (field: ResourceField): OpenAPISchema => {
  const { type, format } = mapTypeToOpenApiType(field.type);

  const schema: OpenAPISchema = {
    type,
  };

  if (format) {
    schema.format = format;
  }

  if (field.description) {
    schema.description = field.description;
  }

  if (field.enum) {
    schema.enum = field.enum;
  }

  if (field.pattern) {
    schema.pattern = field.pattern;
  }

  if (field.type === "string") {
    if (field.minLength !== undefined) {
      schema.minLength = field.minLength;
    }
    if (field.maxLength !== undefined) {
      schema.maxLength = field.maxLength;
    }
  }

  if (field.type === "number") {
    if (field.min !== undefined) {
      schema.minimum = field.min;
    }
    if (field.max !== undefined) {
      schema.maximum = field.max;
    }
  }

  return schema;
};
