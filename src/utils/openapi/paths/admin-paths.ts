import { OpenAPIPathItem } from "../types/index.js";

/**
 * Generate OpenAPI paths for admin routes
 */
export const generateAdminPaths = (): Record<
  string,
  Record<string, OpenAPIPathItem>
> => {
  const paths: Record<string, Record<string, OpenAPIPathItem>> = {};

  // Reset database endpoint
  paths["/__reset"] = {
    post: {
      summary: "Reset database",
      description: "Reset the database to initial state",
      tags: ["admin"],
      security: [{ BearerAuth: [] }],
      responses: {
        "204": { description: "Database reset successfully" },
        "401": { description: "Unauthorized" },
        "403": { description: "Forbidden" },
        "500": { description: "Server error" },
      },
    },
  };

  // Backup database endpoint
  paths["/__backup"] = {
    post: {
      summary: "Backup database",
      description: "Create a backup of the current database state",
      tags: ["admin"],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                path: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Backup created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  path: { type: "string" },
                },
              },
            },
          },
        },
        "401": { description: "Unauthorized" },
        "403": { description: "Forbidden" },
        "500": { description: "Server error" },
      },
    },
  };

  // Restore database endpoint
  paths["/__restore"] = {
    post: {
      summary: "Restore database",
      description: "Restore database from a backup",
      tags: ["admin"],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["path"],
              properties: {
                path: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "204": { description: "Database restored successfully" },
        "400": { description: "Bad request" },
        "401": { description: "Unauthorized" },
        "403": { description: "Forbidden" },
        "500": { description: "Server error" },
      },
    },
  };

  return paths;
};
