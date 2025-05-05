import { CustomRoute } from "../../../types/index.js";
import { OpenAPIPathItem } from "../types/index.js";

/**
 * Generate OpenAPI path objects for custom routes
 */
export const generateCustomRoutePaths = (
  routes: CustomRoute[],
): Record<string, Record<string, OpenAPIPathItem>> => {
  const paths: Record<string, Record<string, OpenAPIPathItem>> = {};

  for (const route of routes) {
    const path = route.path.startsWith("/") ? route.path : `/${route.path}`;

    if (!paths[path]) {
      paths[path] = {};
    }

    // Convert path params from :param style to {param} style
    const openApiPath = path.replace(/:(\w+)/g, "{$1}");

    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }

    const method = route.method.toLowerCase();

    const operation: OpenAPIPathItem = {
      summary: route.description || `Custom ${method} endpoint`,
      description: route.description || `Custom ${method} endpoint`,
      tags: ["custom-routes"],
      responses: {},
    };

    // Add parameters for path parameters
    const pathParams = path.match(/:(\w+)/g);
    if (pathParams) {
      operation.parameters = pathParams.map((param) => {
        const paramName = param.substring(1);
        return {
          name: paramName,
          in: "path",
          required: true,
          description: `Path parameter ${paramName}`,
          schema: { type: "string" },
        };
      });
    }

    // Add request body for POST, PUT, PATCH
    if (["post", "put", "patch"].includes(method)) {
      operation.requestBody = {
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      };
    }

    // Add responses
    operation.responses["200"] = {
      description: "Successful response",
      content: {
        "application/json": {
          schema: { type: "object" },
        },
      },
    };

    if (route.auth?.enabled) {
      operation.responses["401"] = { description: "Unauthorized" };
      operation.responses["403"] = { description: "Forbidden" };
    }

    paths[openApiPath][method] = operation;
  }

  return paths;
};
