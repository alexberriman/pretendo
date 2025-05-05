import { ResourceField } from "../../../types/index.js";

/**
 * Convert a data type from our schema to an OpenAPI schema type
 */
export const mapTypeToOpenApiType = (
  type: ResourceField["type"],
): { type: string; format?: string } => {
  switch (type) {
    case "string":
      return { type: "string" };
    case "number":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "array":
      return { type: "array", format: "json" };
    case "object":
      return { type: "object", format: "json" };
    case "date":
      return { type: "string", format: "date-time" };
    case "uuid":
      return { type: "string", format: "uuid" };
    default:
      return { type: "string" };
  }
};
