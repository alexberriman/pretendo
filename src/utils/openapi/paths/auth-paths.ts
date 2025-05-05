import { OpenAPIPathItem } from "../types/index.js";

/**
 * Generate OpenAPI paths for authentication routes
 */
export const generateAuthPaths = (): Record<
  string,
  Record<string, OpenAPIPathItem>
> => {
  const paths: Record<string, Record<string, OpenAPIPathItem>> = {};

  // Login endpoint
  paths["/auth/login"] = {
    post: {
      summary: "Login",
      description: "Authenticate and get a JWT token",
      tags: ["authentication"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["username", "password"],
              properties: {
                username: { type: "string" },
                password: { type: "string", format: "password" },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Authentication successful",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  token: { type: "string" },
                  user: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      username: { type: "string" },
                      role: { type: "string" },
                    },
                  },
                  expiresAt: { type: "integer", format: "int64" },
                },
              },
            },
          },
        },
        "401": { description: "Invalid credentials" },
      },
    },
  };

  // Logout endpoint
  paths["/auth/logout"] = {
    post: {
      summary: "Logout",
      description: "Invalidate current token",
      tags: ["authentication"],
      security: [{ BearerAuth: [] }],
      responses: {
        "204": { description: "Logged out successfully" },
        "401": { description: "Unauthorized" },
      },
    },
  };

  return paths;
};
