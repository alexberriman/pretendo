import { Request, Response } from "express";
import { CustomRoute } from "../../../types/index.js";

/**
 * Process a JSON response with parameter substitution
 * @param jsonResponse The response object to process
 * @param params Request parameters to substitute
 * @returns Processed response object with parameters substituted
 */
export const processJsonResponse = (
  jsonResponse: Record<string, unknown>,
  params: Record<string, string | string[]>,
): Record<string, unknown> => {
  // Create a copy of the response object so we don't modify the original
  const processedResponse = JSON.parse(JSON.stringify(jsonResponse));

  // Function to recursively replace placeholders with route parameters
  const processObject = (obj: Record<string, unknown>): void => {
    for (const [objKey, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        // Replace placeholders like {id} or {:id} with actual parameter values
        obj[objKey] = value.replace(/\{:?(\w+)\}/g, (_, paramName) => {
          const param = params[paramName];
          return typeof param === "string" ? param : value;
        });
      } else if (typeof value === "object" && value !== null) {
        processObject(value as Record<string, unknown>);
      }
    }
  };

  processObject(processedResponse);
  return processedResponse;
};

/**
 * Handler for JSON type custom routes
 * Handles static JSON responses with parameter substitution
 */
export const handleJsonRoute = (
  req: Request,
  res: Response,
  customRoute: CustomRoute,
): void => {
  // For JSON type routes, just return the configured response
  const jsonResponse = customRoute.response || { message: "Success" };

  // If the response is an object and we have URL parameters, allow dynamic parameter substitution
  if (
    typeof jsonResponse === "object" &&
    jsonResponse !== null &&
    !Array.isArray(jsonResponse) &&
    Object.keys(req.params).length > 0
  ) {
    const processedResponse = processJsonResponse(
      jsonResponse as Record<string, unknown>,
      req.params,
    );
    res.json(processedResponse);
  } else {
    res.json(jsonResponse);
  }
};
