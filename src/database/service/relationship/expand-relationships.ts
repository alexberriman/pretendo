import {
  ApiConfig,
  DbRecord,
  Result,
  Store,
  ok,
} from "../../../types/index.js";
import { expandNestedRelationships } from "./expand-nested-relationships.js";

/**
 * Expand multiple relationships
 */
export const expandRelationships = (
  config: ApiConfig,
  store: Store,
  collection: string,
  records: DbRecord[],
  expandPaths: string[],
): Result<DbRecord[], Error> => {
  if (!expandPaths || expandPaths.length === 0) {
    return ok(records);
  }

  let expandedRecords = [...records];

  // Process each expand path
  for (const path of expandPaths) {
    const expandResult = expandNestedRelationships(
      config,
      store,
      collection,
      expandedRecords,
      path,
    );

    if (!expandResult.ok) {
      return expandResult;
    }

    expandedRecords = expandResult.value;
  }

  return ok(expandedRecords);
};
