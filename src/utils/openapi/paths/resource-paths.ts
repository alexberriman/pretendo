import { Resource } from "../../../types/index.js";
import { OpenAPIPathItem } from "../types/index.js";

/**
 * Generate OpenAPI paths for a resource
 */
export const generateResourcePaths = (
  resource: Resource,
): Record<string, Record<string, OpenAPIPathItem>> => {
  const { name } = resource;
  const primaryKey = resource.primaryKey || "id";
  const paths: Record<string, Record<string, OpenAPIPathItem>> = {};

  // Collection endpoints
  paths[`/${name}`] = {
    get: {
      summary: `Get all ${name}`,
      description: `Returns a paginated list of ${name}`,
      tags: [name],
      parameters: [
        {
          name: "page",
          in: "query",
          description: "Page number",
          schema: { type: "integer", default: 1 },
        },
        {
          name: "limit",
          in: "query",
          description: "Number of items per page",
          schema: { type: "integer", default: 10 },
        },
        {
          name: "sort",
          in: "query",
          description: "Sort criteria (prefix with - for descending)",
          schema: { type: "string" },
        },
        {
          name: "fields",
          in: "query",
          description: "Comma-separated list of fields to include",
          schema: { type: "string" },
        },
        {
          name: "expand",
          in: "query",
          description: "Comma-separated list of relationships to expand",
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: `List of ${name}`,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: {
                      $ref: `#/components/schemas/${name}`,
                    },
                  },
                  meta: {
                    type: "object",
                    properties: {
                      pagination: {
                        type: "object",
                        properties: {
                          currentPage: { type: "integer" },
                          limit: { type: "integer" },
                          totalPages: { type: "integer" },
                          totalItems: { type: "integer" },
                          links: { type: "object" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "401": { description: "Unauthorized" },
        "403": { description: "Forbidden" },
      },
    },
    post: {
      summary: `Create a new ${name.endsWith("ies") ? name.slice(0, -3) + "y" : name.slice(0, -1)}`,
      description: `Creates a new ${name.endsWith("ies") ? name.slice(0, -3) + "y" : name.slice(0, -1)} resource`,
      tags: [name],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: `#/components/schemas/${name}Create` },
          },
        },
      },
      responses: {
        "201": {
          description: "Created successfully",
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${name}` },
            },
          },
        },
        "400": { description: "Bad request" },
        "401": { description: "Unauthorized" },
        "403": { description: "Forbidden" },
        "422": { description: "Validation error" },
      },
    },
  };

  // Individual resource endpoints
  paths[`/${name}/{${primaryKey}}`] = {
    get: {
      summary: `Get a ${name.endsWith("ies") ? name.slice(0, -3) + "y" : name.slice(0, -1)} by ${primaryKey}`,
      description: `Returns a ${name.endsWith("ies") ? name.slice(0, -3) + "y" : name.slice(0, -1)} by its ${primaryKey}`,
      tags: [name],
      parameters: [
        {
          name: primaryKey,
          in: "path",
          required: true,
          description: `${primaryKey} of the ${name.endsWith("ies") ? name.slice(0, -3) + "y" : name.slice(0, -1)}`,
          schema: {
            type: primaryKey === "id" ? "integer" : "string",
          },
        },
        {
          name: "fields",
          in: "query",
          description: "Comma-separated list of fields to include",
          schema: { type: "string" },
        },
        {
          name: "expand",
          in: "query",
          description: "Comma-separated list of relationships to expand",
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: `${name.slice(0, -1)} found`,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${name}` },
            },
          },
        },
        "401": { description: "Unauthorized" },
        "403": { description: "Forbidden" },
        "404": { description: "Not found" },
      },
    },
    put: {
      summary: `Replace a ${name.endsWith("ies") ? name.slice(0, -3) + "y" : name.slice(0, -1)}`,
      description: `Replaces a ${name.endsWith("ies") ? name.slice(0, -3) + "y" : name.slice(0, -1)} resource`,
      tags: [name],
      parameters: [
        {
          name: primaryKey,
          in: "path",
          required: true,
          description: `${primaryKey} of the ${name.endsWith("ies") ? name.slice(0, -3) + "y" : name.slice(0, -1)} to replace`,
          schema: {
            type: primaryKey === "id" ? "integer" : "string",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: `#/components/schemas/${name}Update` },
          },
        },
      },
      responses: {
        "200": {
          description: "Updated successfully",
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${name}` },
            },
          },
        },
        "400": { description: "Bad request" },
        "401": { description: "Unauthorized" },
        "403": { description: "Forbidden" },
        "404": { description: "Not found" },
        "422": { description: "Validation error" },
      },
    },
    patch: {
      summary: `Update a ${name.endsWith("ies") ? name.slice(0, -3) + "y" : name.slice(0, -1)}`,
      description: `Partially updates a ${name.endsWith("ies") ? name.slice(0, -3) + "y" : name.slice(0, -1)} resource`,
      tags: [name],
      parameters: [
        {
          name: primaryKey,
          in: "path",
          required: true,
          description: `${primaryKey} of the ${name.endsWith("ies") ? name.slice(0, -3) + "y" : name.slice(0, -1)} to update`,
          schema: {
            type: primaryKey === "id" ? "integer" : "string",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: `#/components/schemas/${name}Patch` },
          },
        },
      },
      responses: {
        "200": {
          description: "Updated successfully",
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${name}` },
            },
          },
        },
        "400": { description: "Bad request" },
        "401": { description: "Unauthorized" },
        "403": { description: "Forbidden" },
        "404": { description: "Not found" },
        "422": { description: "Validation error" },
      },
    },
    delete: {
      summary: `Delete a ${name.endsWith("ies") ? name.slice(0, -3) + "y" : name.slice(0, -1)}`,
      description: `Deletes a ${name.endsWith("ies") ? name.slice(0, -3) + "y" : name.slice(0, -1)} resource`,
      tags: [name],
      parameters: [
        {
          name: primaryKey,
          in: "path",
          required: true,
          description: `${primaryKey} of the ${name.endsWith("ies") ? name.slice(0, -3) + "y" : name.slice(0, -1)} to delete`,
          schema: {
            type: primaryKey === "id" ? "integer" : "string",
          },
        },
      ],
      responses: {
        "204": { description: "Deleted successfully" },
        "401": { description: "Unauthorized" },
        "403": { description: "Forbidden" },
        "404": { description: "Not found" },
      },
    },
  };

  // Add relationship endpoints for each relationship
  if (resource.relationships) {
    for (const rel of resource.relationships) {
      const relPath = `/${name}/{${primaryKey}}/${rel.resource}`;
      const singularName = name.endsWith("ies")
        ? name.slice(0, -3) + "y"
        : name.slice(0, -1);

      paths[relPath] = {
        get: {
          summary: `Get ${rel.resource} related to ${singularName}`,
          description: `Returns ${rel.resource} related to the ${singularName}`,
          tags: [name, rel.resource],
          parameters: [
            {
              name: primaryKey,
              in: "path",
              required: true,
              description: `${primaryKey} of the ${singularName}`,
              schema: {
                type: primaryKey === "id" ? "integer" : "string",
              },
            },
            {
              name: "page",
              in: "query",
              description: "Page number",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              description: "Number of items per page",
              schema: { type: "integer", default: 10 },
            },
            {
              name: "sort",
              in: "query",
              description: "Sort criteria",
              schema: { type: "string" },
            },
            {
              name: "fields",
              in: "query",
              description: "Comma-separated list of fields to include",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: `Related ${rel.resource}`,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          $ref: `#/components/schemas/${rel.resource}`,
                        },
                      },
                      meta: {
                        type: "object",
                        properties: {
                          pagination: {
                            type: "object",
                            properties: {
                              currentPage: { type: "integer" },
                              limit: { type: "integer" },
                              totalPages: { type: "integer" },
                              totalItems: { type: "integer" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
            "404": { description: "Not found" },
          },
        },
      };
    }
  }

  return paths;
};
