import { ApiConfig } from "../../types/index.js";
import {
  OpenAPIDocument,
  OpenAPIPathItem,
  OpenAPISchema,
} from "./types/index.js";
import { generateResourceSchema } from "./schemas/index.js";
import {
  generateResourcePaths,
  generateCustomRoutePaths,
  generateAdminPaths,
  generateAuthPaths,
} from "./paths/index.js";
import { generateSecurityScheme } from "./security/index.js";
import {
  generateAdditionalSchemas,
  generateExamples,
} from "./generators/index.js";

/**
 * Convert API config to OpenAPI 3.0 specification
 */
export const convertToOpenApi = (config: ApiConfig): OpenAPIDocument => {
  const paths: Record<string, Record<string, OpenAPIPathItem>> = {};
  const schemas: Record<string, OpenAPISchema> = {};

  // Generate schemas for resources
  for (const resource of config.resources) {
    schemas[resource.name] = generateResourceSchema(resource);
  }

  // Generate additional schemas for request/response models
  const additionalSchemas = generateAdditionalSchemas(config.resources);
  Object.assign(schemas, additionalSchemas);

  // Generate paths for resources
  for (const resource of config.resources) {
    const resourcePaths = generateResourcePaths(resource);
    Object.assign(paths, resourcePaths);
  }

  // Generate paths for custom routes
  if (config.routes && config.routes.length > 0) {
    const customRoutePaths = generateCustomRoutePaths(config.routes);
    Object.assign(paths, customRoutePaths);
  }

  // Add auth routes if enabled
  if (config.options?.auth?.enabled) {
    const authPaths = generateAuthPaths();
    Object.assign(paths, authPaths);
  }

  // Add admin routes
  const adminPaths = generateAdminPaths();
  Object.assign(paths, adminPaths);

  // Generate examples
  const examples = generateExamples(config.resources);

  // Generate security scheme
  const securitySchemes = generateSecurityScheme(config);

  // Build the OpenAPI document
  const openApiDocument: OpenAPIDocument = {
    openapi: "3.0.3",
    info: {
      title: "Pretendo API",
      description: "API documentation for Pretendo mock REST API",
      version: "1.0.0",
    },
    servers: [
      {
        url: `http://${config.options?.host || "localhost"}:${
          config.options?.port || 3000
        }`,
        description: "API server",
      },
    ],
    paths,
    components: {
      schemas,
      examples,
      securitySchemes,
    },
  };

  // Remove empty components
  if (Object.keys(examples).length === 0) {
    delete openApiDocument.components.examples;
  }

  if (!securitySchemes) {
    delete openApiDocument.components.securitySchemes;
  }

  return openApiDocument;
};
