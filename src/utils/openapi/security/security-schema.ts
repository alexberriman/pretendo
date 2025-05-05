import { ApiConfig } from "../../../types/index.js";

/**
 * Generate an OpenAPI security scheme based on API configuration
 */
export const generateSecurityScheme = (
  config: ApiConfig,
):
  | Record<
      string,
      {
        type: string;
        scheme: string;
        bearerFormat: string;
        description: string;
      }
    >
  | undefined => {
  if (!config.options?.auth?.enabled) {
    return undefined;
  }

  return {
    BearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "JWT token authentication",
    },
  };
};
