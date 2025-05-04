import { DbRecord, Result, ok } from "../../../types/index.js";

/**
 * Resets the store data with new data
 */
export const resetStore = (
  _newData: Record<string, DbRecord[]>,
): Result<void, Error> => {
  return ok(undefined);
};
