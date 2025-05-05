import { Resource } from "../../../types/index.js";

/**
 * Generate examples for requests and responses
 */
export const generateExamples = (
  resources: Resource[],
): Record<string, { value: unknown }> => {
  const examples: Record<string, { value: unknown }> = {};

  for (const resource of resources) {
    const name = resource.name;

    if (resource.initialData && resource.initialData.length > 0) {
      examples[`${name}Example`] = {
        value: resource.initialData[0],
      };
    }
  }

  return examples;
};
