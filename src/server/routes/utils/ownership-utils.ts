import { Request } from "express";
import {
  DatabaseService,
  RequestWithApiConfig,
  RequestWithResource,
  RequestWithUser,
} from "../../../types/index.js";
import { logger } from "../../../utils/debug-logger.js";

/**
 * Handles automatic ownership assignment for resource creation
 * Returns the modified data with the correct owner ID set
 */
export const handleOwnershipAssignment = async (
  req: Request,
  db: DatabaseService,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const dataToCreate = { ...data };
  const resourceConfig = (req as RequestWithResource).resource;
  const user = (req as unknown as RequestWithUser).user;

  // If no user or no ownership field, return data unchanged
  if (!resourceConfig?.ownedBy || !user) {
    logger.info(
      `No owner assignment: resourceHasOwnerField=${!!resourceConfig?.ownedBy}, userAvailable=${!!user}`,
    );
    return dataToCreate;
  }

  const ownerField = resourceConfig.ownedBy;
  const username = user?.username;
  const userId = user?.id;

  logger.info(
    `Creating resource with automatic owner assignment: field=${ownerField}, username=${username}, userId=${userId}`,
  );

  // If we have a userId directly from the token, use it
  if (userId) {
    logger.info(`Using userId from token: ${userId}`);
    dataToCreate[ownerField] = userId;
    return dataToCreate;
  }

  // If no userId but we have username, try to look it up from the database
  if (username) {
    // Get user resource configuration from the request (added by authorization middleware)
    const apiConfig = (req as unknown as RequestWithApiConfig).apiConfig;
    const userResourceName = apiConfig?.options?.auth?.userResource || "users";
    const usernameField = apiConfig?.options?.auth?.usernameField || "username";

    logger.info(
      `Looking up user ID: resource=${userResourceName}, field=${usernameField}, value=${username}`,
    );

    // Find the user's ID
    const usersResourceResult = db.getResource(userResourceName);
    if (usersResourceResult.ok) {
      const usersResource = usersResourceResult.value;
      // Create query using the configured username field
      const query: Record<string, string> = {};
      query[usernameField] = username;

      const userResult = await usersResource.findOne(query);

      if (userResult.ok && userResult.value) {
        const foundUserId = userResult.value.id;
        logger.info(`Found user ID for ${username}: ${foundUserId}`);

        // Set the owner field regardless of what was provided in the request
        dataToCreate[ownerField] = foundUserId;
      } else {
        logger.info(
          `User ${username} not found: ${userResult.ok ? "No user found" : userResult.error.message}`,
        );
      }
    } else {
      logger.info(
        `User resource ${userResourceName} not found: ${usersResourceResult.error?.message}`,
      );
    }
  } else {
    logger.info(`No username or userId available for owner assignment`);
  }

  return dataToCreate;
};
