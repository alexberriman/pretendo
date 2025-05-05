import { describe, it, expect } from "vitest";
import {
  OpenAPISchema,
  OpenAPIParameter,
  OpenAPIResponse,
  OpenAPIPathItem,
  OpenAPIDocument,
} from "./index.js";

describe("OpenAPI Types", () => {
  it("should define OpenAPISchema type", () => {
    const schema: OpenAPISchema = {
      type: "string",
      format: "email",
      description: "User email",
    };

    expect(schema).toBeDefined();
    expect(schema.type).toBe("string");
    expect(schema.format).toBe("email");
    expect(schema.description).toBe("User email");
  });

  it("should define OpenAPISchema with $ref", () => {
    const schema: OpenAPISchema = {
      $ref: "#/components/schemas/User",
    };

    expect(schema).toBeDefined();
    expect(schema.$ref).toBe("#/components/schemas/User");
  });

  it("should define OpenAPIParameter type", () => {
    const parameter: OpenAPIParameter = {
      name: "userId",
      in: "path",
      description: "ID of the user",
      required: true,
      schema: { type: "integer" },
    };

    expect(parameter).toBeDefined();
    expect(parameter.name).toBe("userId");
    expect(parameter.in).toBe("path");
    expect(parameter.required).toBe(true);
    expect(parameter.schema.type).toBe("integer");
  });

  it("should define OpenAPIResponse type", () => {
    const response: OpenAPIResponse = {
      description: "Successful response",
      content: {
        "application/json": {
          schema: { type: "object", properties: { id: { type: "integer" } } },
        },
      },
    };

    expect(response).toBeDefined();
    expect(response.description).toBe("Successful response");
    expect(response.content).toBeDefined();
  });

  it("should define OpenAPIPathItem type", () => {
    const pathItem: OpenAPIPathItem = {
      summary: "Get user",
      description: "Returns user details",
      tags: ["users"],
      responses: {
        "200": {
          description: "Successful response",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" },
            },
          },
        },
      },
    };

    expect(pathItem).toBeDefined();
    expect(pathItem.summary).toBe("Get user");
    expect(pathItem.tags).toEqual(["users"]);
    expect(pathItem.responses["200"]).toBeDefined();
  });

  it("should define OpenAPIDocument type", () => {
    const document: OpenAPIDocument = {
      openapi: "3.0.3",
      info: {
        title: "Test API",
        description: "Test API description",
        version: "1.0.0",
      },
      servers: [
        {
          url: "https://api.example.com",
          description: "Production server",
        },
      ],
      paths: {},
      components: {
        schemas: {},
      },
    };

    expect(document).toBeDefined();
    expect(document.openapi).toBe("3.0.3");
    expect(document.info.title).toBe("Test API");
    expect(document.servers[0].url).toBe("https://api.example.com");
  });
});
