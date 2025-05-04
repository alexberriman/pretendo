import { Request, Response, NextFunction } from "express";
import { CustomRoute } from "../../../types/index.js";
import { logger } from "../../../utils/debug-logger.js";

/**
 * Creates a handler for custom routes defined in the schema
 */
export const createCustomRouteHandler = (customRoute: CustomRoute) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      logger.info(
        `Handling custom route: ${customRoute.method.toUpperCase()} ${customRoute.path}`,
      );

      if (customRoute.type === "json") {
        // For JSON type routes, just return the configured response
        const jsonResponse = customRoute.response || { message: "Success" };

        // If the response is an object and we have URL parameters, allow dynamic parameter substitution
        if (
          typeof jsonResponse === "object" &&
          jsonResponse !== null &&
          !Array.isArray(jsonResponse) &&
          Object.keys(req.params).length > 0
        ) {
          // Create a copy of the response object so we don't modify the original
          const processedResponse = JSON.parse(JSON.stringify(jsonResponse));

          // Function to recursively replace placeholders with route parameters
          const processObject = (obj: Record<string, unknown>): void => {
            for (const [key, value] of Object.entries(obj)) {
              if (typeof value === "string") {
                // Replace placeholders like {id} or {:id} with actual parameter values
                obj[key] = value.replace(/\{:?(\w+)\}/g, (_, paramName) => {
                  return req.params[paramName] || value;
                });
              } else if (typeof value === "object" && value !== null) {
                processObject(value as Record<string, unknown>);
              }
            }
          };

          processObject(processedResponse);
          res.json(processedResponse);
        } else {
          res.json(jsonResponse);
        }
      } else if (customRoute.type === "javascript") {
        // For JavaScript type routes, we're not executing the code yet
        // Just return "hello world" as specified, but include the parameters
        logger.info(
          `JavaScript route execution placeholder: ${customRoute.path}`,
        );

        // Process parameters - if any parameter is an array, convert it to a string joined by '/'
        const processedParams = { ...req.params };
        for (const [key, value] of Object.entries(processedParams)) {
          if (Array.isArray(value)) {
            processedParams[key] = value.join("/");
          }
        }

        // Include any URL parameters in the response
        res.json({
          message: "hello world",
          params: processedParams,
          query: req.query,
        });
      } else {
        // This should never happen due to TypeScript, but just in case
        res.status(500).json({
          status: 500,
          message: "Invalid custom route type",
          code: "INVALID_ROUTE_TYPE",
        });
      }
    } catch (error) {
      next(error);
    }
  };
};
