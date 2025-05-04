import { ApiConfig } from "../../../types/index.js";

/**
 * Gets the primary key for a collection from API configuration
 */
export const getPrimaryKey = (
  collection: string,
  apiConfig: Pick<ApiConfig, "resources">,
): string => {
  const resource = apiConfig.resources.find((r) => r.name === collection);
  return resource?.primaryKey || "id";
};
