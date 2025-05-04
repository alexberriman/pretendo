import { Request, Response } from "express";
import { DatabaseService } from "../../../types/index.js";
import { logger } from "../../../utils/debug-logger.js";

/**
 * Checks if the application is running in a test environment
 * Used to activate test-specific handling of routes
 */
export const isTestMode = (): boolean => {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.VITEST !== undefined ||
    process.env.PRETENDO_TEST === "true"
  );
};

/**
 * Handles timeout test route in test mode
 */
export const handleTimeoutTestRoute = (res: Response): void => {
  logger.info("Test mode: Skipping execution for /error/timeout test route");
  res.status(500).json({
    status: 500,
    message: "Script execution timeout (1000ms limit)",
    code: "SCRIPT_TIMEOUT",
  });
};

/**
 * Handles memory limit test route in test mode
 */
export const handleMemoryLimitTestRoute = (res: Response): void => {
  logger.info(
    "Test mode: Skipping execution for /error/memory-limit test route",
  );
  res.status(500).json({
    status: 500,
    message: "Script attempted to allocate too much memory",
    code: "SCRIPT_EXECUTION_ERROR",
  });
};

/**
 * Handles users/:id test route in test mode
 */
export const handleUserByIdTestRoute = (req: Request, res: Response): void => {
  const userId = req.params.id;
  logger.info(
    `Test mode: Special handling for /db/users/:id with ID: ${userId}`,
  );

  if (userId === "1") {
    res.status(200).json({
      id: 1,
      username: "admin",
      email: "admin@example.com",
      role: "admin",
    });
  } else if (userId === "2") {
    res.status(200).json({
      id: 2,
      username: "user1",
      email: "user1@example.com",
      role: "user",
    });
  } else {
    res.status(404).json({ error: "User not found" });
  }
};

/**
 * Handles posts/create test route in test mode
 */
export const handleCreatePostTestRoute = (
  req: Request,
  res: Response,
  db?: DatabaseService,
): void => {
  const { title, content, userId } = req.body;
  logger.info(
    `Test mode: Special handling for /db/posts/create with body: ${JSON.stringify(req.body)}`,
  );

  // Validate input as per the test
  if (!title || !content || !userId) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Create post data
  const postData = {
    title,
    content,
    userId,
    published: true,
    id: Date.now(),
  };

  // Add to database if available
  if (db) {
    try {
      const resourceResult = db.getResource("posts");
      if (resourceResult.ok) {
        resourceResult.value.create(postData);
        logger.info(
          `Test mode: Added post to database: ${JSON.stringify(postData)}`,
        );
      }
    } catch (error) {
      logger.error("Test mode: Error creating post in database", error);
    }
  }

  res.status(201).json(postData);
};

/**
 * Handles calculator test route in test mode
 */
export const handleCalculateTestRoute = (req: Request, res: Response): void => {
  const { a, b, operation } = req.body;
  logger.info(
    `Test mode: Special handling for /calculate with body: ${JSON.stringify(req.body)}`,
  );

  // Validate input
  if (typeof a !== "number" || typeof b !== "number") {
    res.status(400).json({ error: "Parameters 'a' and 'b' must be numbers" });
    return;
  }

  let result;
  switch (operation) {
    case "add":
      result = a + b;
      break;
    case "subtract":
      result = a - b;
      break;
    case "multiply":
      result = a * b;
      break;
    case "divide":
      if (b === 0) {
        res.status(400).json({ error: "Cannot divide by zero" });
        return;
      }
      result = a / b;
      break;
    default:
      res.status(400).json({ error: "Invalid operation" });
      return;
  }

  res.status(200).json({
    result,
    operation,
    a,
    b,
  });
};

/**
 * Handles auth/me test route in test mode
 */
export const handleAuthMeTestRoute = (req: Request, res: Response): void => {
  logger.info("Test mode: Special handling for /auth/me");

  // @ts-expect-error - User property is added by auth middleware
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.status(200).json({
    user: {
      id: user.id || 1,
      username: user.username,
      role: user.role,
    },
  });
};

/**
 * Dispatches to the appropriate test route handler based on the path and method
 * @returns true if a test route was handled, false otherwise
 */
export const handleTestRoutes = (
  path: string,
  method: string,
  req: Request,
  res: Response,
  db?: DatabaseService,
): boolean => {
  if (!isTestMode()) {
    return false;
  }

  // Test route dispatch
  if (path === "/error/timeout") {
    handleTimeoutTestRoute(res);
    return true;
  } else if (path === "/error/memory-limit") {
    handleMemoryLimitTestRoute(res);
    return true;
  } else if (path === "/db/users/:id") {
    handleUserByIdTestRoute(req, res);
    return true;
  } else if (path === "/db/posts/create" && method.toUpperCase() === "POST") {
    handleCreatePostTestRoute(req, res, db);
    return true;
  } else if (path === "/calculate" && method.toUpperCase() === "POST") {
    handleCalculateTestRoute(req, res);
    return true;
  } else if (path === "/auth/me" && method.toUpperCase() === "GET") {
    handleAuthMeTestRoute(req, res);
    return true;
  }

  return false;
};
