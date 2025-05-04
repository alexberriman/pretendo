import { Request } from "express";
import { RequestWithResource, RequestWithUser } from "../../../types/index.js";
import { logger } from "../../../utils/debug-logger.js";
import { isUserResourceOwner } from "../../utils/is-user-resource-owner.js";

/**
 * Parses an ID from a string parameter, converting to number if possible
 */
export const parseResourceId = (id: string): string | number => {
  if (id === "") return id;
  return !isNaN(Number(id)) ? Number(id) : id;
};

/**
 * Checks if a request requires owner check and strict owner check
 */
export const getOwnerCheckFlags = (
  req: Request,
): { ownerCheckOnly: boolean; strictOwnerCheck: boolean } => {
  const ownerCheckOnly = (
    req as { ownerCheckOnly?: boolean; strictOwnerCheck?: boolean }
  ).ownerCheckOnly;

  const strictOwnerCheck = (req as { strictOwnerCheck?: boolean })
    .strictOwnerCheck;

  return {
    ownerCheckOnly: !!ownerCheckOnly,
    strictOwnerCheck: !!strictOwnerCheck,
  };
};

/**
 * Performs ownership check for a record
 * Returns true if the user is the owner or if ownership check is not required
 */
export const checkOwnership = (
  req: Request,
  record: Record<string, unknown>,
  options: { logContext: string },
): boolean => {
  const { ownerCheckOnly, strictOwnerCheck } = getOwnerCheckFlags(req);

  // If no owner check required and not strict, access is granted
  if (!ownerCheckOnly && !strictOwnerCheck) {
    return true;
  }

  // If strict owner check but no owner check, access is denied
  if (strictOwnerCheck && !ownerCheckOnly) {
    logger.info(
      `STRICT owner check failed - no ownership check was performed (${options.logContext})`,
    );
    return false;
  }

  // If owner check is required, verify ownership
  if (ownerCheckOnly) {
    const resourceConfig = (req as RequestWithResource).resource;
    const user = (req as unknown as RequestWithUser).user;

    if (resourceConfig?.ownedBy && user) {
      const ownerField = resourceConfig.ownedBy;

      logger.info(
        `Checking ownership (${options.logContext}): ${ownerField}=${record[ownerField]}, user=${user.username}, userId=${user.id}, strictCheck=${!!strictOwnerCheck}`,
      );

      // Check direct ownership - record's owner field equals user.id
      const isOwner = isUserResourceOwner(record[ownerField], user.id);

      logger.info(
        `Ownership check result: isOwner=${isOwner}, recordOwnerId=${record[ownerField]}, userId=${user.id}`,
      );

      if (!isOwner) {
        logger.info(
          `Ownership check failed (${options.logContext}) - forbidden`,
        );
        return false;
      }

      logger.info(
        `Ownership check passed (${options.logContext}) - access granted`,
      );
      return true;
    }
  }

  // Default to granting access if no ownership checks were applicable
  return true;
};
