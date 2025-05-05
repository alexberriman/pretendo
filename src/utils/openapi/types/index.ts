/**
 * OpenAPI Schema Type definition
 */
export type OpenAPISchema =
  | {
      type: string;
      format?: string;
      description?: string;
      enum?: unknown[];
      pattern?: string;
      minLength?: number;
      maxLength?: number;
      minimum?: number;
      maximum?: number;
      properties?: Record<string, OpenAPISchema>;
      required?: string[];
      items?: OpenAPISchema;
      $ref?: string;
      default?: unknown;
    }
  | {
      $ref: string;
    };

/**
 * OpenAPI Parameter Type definition
 */
export type OpenAPIParameter = {
  name: string;
  in: string;
  description: string;
  required?: boolean;
  schema: OpenAPISchema;
};

/**
 * OpenAPI Response Type definition
 */
export type OpenAPIResponse = {
  description: string;
  content?: Record<string, { schema: OpenAPISchema }>;
};

/**
 * OpenAPI Path Item Type definition
 */
export type OpenAPIPathItem = {
  summary: string;
  description: string;
  tags: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: {
    required?: boolean;
    content: Record<string, { schema: OpenAPISchema }>;
  };
  responses: Record<string, OpenAPIResponse>;
  security?: { [key: string]: string[] }[];
};

/**
 * OpenAPI Document Type definition
 */
export type OpenAPIDocument = {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: {
    url: string;
    description: string;
  }[];
  paths: Record<string, Record<string, OpenAPIPathItem>>;
  components: {
    schemas: Record<string, OpenAPISchema>;
    examples?: Record<string, { value: unknown }>;
    securitySchemes?: Record<
      string,
      {
        type: string;
        scheme: string;
        bearerFormat?: string;
        description?: string;
      }
    >;
  };
};
