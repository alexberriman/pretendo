import { ApiConfig } from "../types/index.js";

// This schema is a JSON representation of the config structure
// It can be used for documentation and validation
export const configSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["resources"],
  properties: {
    resources: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "fields"],
        properties: {
          name: {
            type: "string",
            description: "Name of the resource (plural form recommended)",
          },
          primaryKey: {
            type: "string",
            description: "Name of the primary key field (defaults to 'id')",
          },
          fields: {
            type: "array",
            items: {
              type: "object",
              required: ["name", "type"],
              properties: {
                name: {
                  type: "string",
                  description: "Field name in camelCase",
                },
                type: {
                  type: "string",
                  enum: [
                    "string",
                    "number",
                    "boolean",
                    "object",
                    "array",
                    "date",
                    "uuid",
                  ],
                  description: "Field data type",
                },
                required: {
                  type: "boolean",
                  description: "Whether the field is required",
                },
                defaultValue: {
                  description: "Default value for the field",
                },
                description: {
                  type: "string",
                  description: "Description of the field",
                },
              },
            },
          },
          relationships: {
            type: "array",
            items: {
              type: "object",
              required: ["type", "resource", "foreignKey"],
              properties: {
                type: {
                  type: "string",
                  enum: ["belongsTo", "hasOne", "hasMany", "manyToMany"],
                  description: "Type of relationship",
                },
                resource: {
                  type: "string",
                  description: "Name of the related resource",
                },
                foreignKey: {
                  type: "string",
                  description: "Foreign key field name",
                },
                targetKey: {
                  type: "string",
                  description:
                    "Target key field name (defaults to primary key of target resource)",
                },
                through: {
                  type: "string",
                  description: "Join table for many-to-many relationships",
                },
              },
            },
          },
          initialData: {
            type: "array",
            description: "Initial data for this resource",
            items: {
              type: "object",
            },
          },
        },
      },
    },
    options: {
      type: "object",
      properties: {
        port: {
          type: "number",
          description: "Port for the API server (default: 3000)",
        },
        host: {
          type: "string",
          description: "Host for the API server (default: localhost)",
        },
        corsEnabled: {
          type: "boolean",
          description: "Whether CORS is enabled (default: true)",
        },
        auth: {
          type: "object",
          properties: {
            enabled: {
              type: "boolean",
              description: "Whether authentication is enabled",
            },
            tokenExpiration: {
              type: "number",
              description: "Token expiration in seconds",
            },
            authEndpoint: {
              type: "string",
              description: "Authentication endpoint (default: /auth/login)",
            },
            secretKey: {
              type: "string",
              description: "Secret key for JWT token signing",
            },
            tokenHeader: {
              type: "string",
              description:
                "Header name for authentication token (default: Authorization)",
            },
            users: {
              type: "array",
              description: "Predefined users for authentication",
              items: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: {
                    type: "string",
                  },
                  password: {
                    type: "string",
                  },
                  role: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        latency: {
          type: "object",
          properties: {
            enabled: {
              type: "boolean",
              description: "Whether latency simulation is enabled",
            },
            fixed: {
              type: "number",
              description: "Fixed delay in milliseconds",
            },
            min: {
              type: "number",
              description: "Minimum delay in milliseconds for random delay",
            },
            max: {
              type: "number",
              description: "Maximum delay in milliseconds for random delay",
            },
          },
        },
        errorSimulation: {
          type: "object",
          properties: {
            enabled: {
              type: "boolean",
              description: "Whether error simulation is enabled",
            },
            rate: {
              type: "number",
              description: "Probability of error (0-1)",
            },
            statusCodes: {
              type: "array",
              items: {
                type: "number",
              },
              description: "Possible error status codes to return",
            },
            queryParamTrigger: {
              type: "string",
              description:
                "Query param to trigger errors (e.g., ?errorCode=500)",
            },
          },
        },
        dbPath: {
          type: "string",
          description: "Path to JSON storage file",
        },
        logRequests: {
          type: "boolean",
          description: "Whether to log API requests",
        },
        allowPartialResponses: {
          type: "boolean",
          description:
            "Whether to allow partial responses with fields parameter",
        },
        defaultPageSize: {
          type: "number",
          description: "Default page size for pagination",
        },
        maxPageSize: {
          type: "number",
          description: "Maximum allowed page size",
        },
        docs: {
          type: "object",
          description: "OpenAPI documentation configuration",
          properties: {
            enabled: {
              type: "boolean",
              description:
                "Whether the OpenAPI documentation endpoint is enabled",
            },
            requireAuth: {
              type: "boolean",
              description:
                "Whether to require authentication for the documentation endpoint",
            },
          },
        },
      },
    },
    data: {
      type: "object",
      description: "Initial data for all resources",
      additionalProperties: {
        type: "array",
        items: {
          type: "object",
        },
      },
    },
  },
} as const;

// Export a type-safe example config object
export const exampleConfig: ApiConfig = {
  resources: [
    {
      name: "users",
      fields: [
        { name: "id", type: "number" },
        { name: "name", type: "string" },
        { name: "email", type: "string" },
        { name: "role", type: "string", defaultValue: "user" },
      ],
      relationships: [
        {
          type: "hasMany",
          resource: "posts",
          foreignKey: "userId",
        },
      ],
    },
    {
      name: "posts",
      fields: [
        { name: "id", type: "number" },
        { name: "title", type: "string" },
        { name: "content", type: "string" },
        { name: "userId", type: "number" },
      ],
      relationships: [
        {
          type: "belongsTo",
          resource: "users",
          foreignKey: "userId",
        },
        {
          type: "hasMany",
          resource: "comments",
          foreignKey: "postId",
        },
      ],
    },
    {
      name: "comments",
      fields: [
        { name: "id", type: "number" },
        { name: "content", type: "string" },
        { name: "postId", type: "number" },
        { name: "userId", type: "number" },
      ],
      relationships: [
        {
          type: "belongsTo",
          resource: "posts",
          foreignKey: "postId",
        },
        {
          type: "belongsTo",
          resource: "users",
          foreignKey: "userId",
        },
      ],
    },
  ],
  options: {
    port: 3000,
    corsEnabled: true,
    auth: {
      enabled: true,
      users: [
        { username: "admin", password: "password", role: "admin" },
        { username: "user", password: "password", role: "user" },
      ],
    },
    latency: {
      enabled: true,
      min: 100,
      max: 500,
    },
  },
  data: {
    users: [
      { id: 1, name: "John Doe", email: "john@example.com", role: "admin" },
      { id: 2, name: "Jane Smith", email: "jane@example.com", role: "user" },
    ],
    posts: [
      { id: 1, title: "First post", content: "Hello world", userId: 1 },
      { id: 2, title: "Second post", content: "More content", userId: 2 },
    ],
    comments: [
      { id: 1, content: "Great post!", postId: 1, userId: 2 },
      { id: 2, content: "Thanks!", postId: 1, userId: 1 },
    ],
  },
};
