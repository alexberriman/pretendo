import { logger } from "../../utils/debug-logger.js";

/**
 * Checks if user is the owner of a resource
 * This handles both string and numeric ID comparisons in a more robust way
 */
export const isUserResourceOwner = (
  recordOwnerId: unknown,
  userId: unknown,
): boolean => {
  logger.info(
    `Comparing ownership IDs: recordOwnerId=${recordOwnerId} (${typeof recordOwnerId}), userId=${userId} (${typeof userId})`,
  );

  // Special case: if either is undefined or null, they can't match
  if (
    recordOwnerId === undefined ||
    recordOwnerId === null ||
    userId === undefined ||
    userId === null
  ) {
    logger.info("Ownership check failed: one of the IDs is null or undefined");
    return false;
  }

  // Convert both to strings and compare - most reliable method
  const recordOwnerIdStr = String(recordOwnerId).trim();
  const userIdStr = String(userId).trim();

  // Direct string comparison
  if (recordOwnerIdStr === userIdStr) {
    logger.info("Ownership match by direct string comparison");
    return true;
  }

  // Try numeric comparison if both can be parsed completely as numbers
  // We need to validate that the strings contain only numbers to avoid issues
  // like "123abc" being parsed as 123
  const isRecordOwnerNumeric = /^[+-]?\d*\.?\d+$/.test(recordOwnerIdStr);
  const isUserIdNumeric = /^[+-]?\d*\.?\d+$/.test(userIdStr);

  if (isRecordOwnerNumeric && isUserIdNumeric) {
    const recordOwnerIdNum = parseFloat(recordOwnerIdStr);
    const userIdNum = parseFloat(userIdStr);

    if (recordOwnerIdNum === userIdNum) {
      logger.info("Ownership match by numeric comparison");
      return true;
    }
  }

  // No match
  logger.info(
    "Ownership check failed: IDs don't match by string or numeric comparison",
  );
  return false;
};
