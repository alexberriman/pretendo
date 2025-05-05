/**
 * Convert OpenAPI specification to YAML format
 */
export const convertToYaml = (openApiSpec: Record<string, unknown>): string => {
  try {
    // Using a dynamic import for the yaml package since it might not be available
    // In a real implementation, you would use a proper YAML library (like js-yaml)
    // For this prototype, we just return a placeholder

    // Note: In a real implementation, you would:
    // 1. Import js-yaml package
    // 2. Use yaml.dump(openApiSpec) to convert to YAML

    // For this prototype, we'll simulate a simple JSON to YAML conversion
    const simpleYamlConvert = (
      obj: Record<string, unknown>,
      level = 0,
    ): string => {
      const indent = "  ".repeat(level);
      let result = "";

      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
          continue;
        }

        if (typeof value === "object" && !Array.isArray(value)) {
          result += `${indent}${key}:\n${simpleYamlConvert(
            value as Record<string, unknown>,
            level + 1,
          )}`;
        } else if (Array.isArray(value)) {
          result += `${indent}${key}:\n`;
          for (const item of value) {
            if (typeof item === "object") {
              result += `${indent}- \n${simpleYamlConvert(
                item as Record<string, unknown>,
                level + 2,
              ).replace(/^/gm, "  ")}`;
            } else {
              result += `${indent}- ${item}\n`;
            }
          }
        } else {
          // For primitive values
          result += `${indent}${key}: ${value}\n`;
        }
      }

      return result;
    };

    return simpleYamlConvert(openApiSpec as Record<string, unknown>);
  } catch (error) {
    console.error("Error converting to YAML:", error);
    return "# Error converting to YAML - please install js-yaml package";
  }
};
