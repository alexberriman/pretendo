import { ApiConfig } from "../../types/index.js";
import { Store } from "../../types/index.js";

/**
 * Gets database statistics for all resources
 */
export const getStats = (
  config: ApiConfig,
  store: Store,
): Record<string, { count: number; lastModified: number }> => {
  const stats: Record<string, { count: number; lastModified: number }> = {};

  // Get all resources
  for (const resource of config.resources) {
    const resourceName = resource.name;
    const data = store.getData(resourceName);

    if ("ok" in data && data.ok) {
      stats[resourceName] = {
        count: data.value.length,
        lastModified: Date.now(), // Using current time as we don't track modification times
      };
    } else {
      stats[resourceName] = {
        count: 0,
        lastModified: Date.now(),
      };
    }
  }

  return stats;
};
