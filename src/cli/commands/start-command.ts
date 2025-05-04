import { createDatabaseService } from "../../database/index.js";
import { createServer } from "../../server/index.js";
import { parseFromYaml } from "../../config/index.js";
import { applyCliOptions } from "../config/options.js";
import { resolveFileLocation } from "../utils/path-resolver.js";
import { logError, logInfo } from "../utils/logger.js";
import { InteractiveCliManager } from "../interactive/index.js";
import { runNonInteractiveMode } from "../services/server/non-interactive.js";
import chalk from "chalk";

/**
 * Handler for the 'start' command
 * Starts the mock API server
 */
export const startCommandHandler = async (
  file: string,
  options: Record<string, unknown>,
): Promise<void> => {
  try {
    // Resolve file path or URL
    const filePathOrUrl = await resolveFileLocation(
      file,
      options.prompt === false,
    );

    // Parse config
    const configResult = await parseFromYaml(filePathOrUrl);

    if (configResult.ok === false) {
      logError(
        chalk.red("Error loading configuration:"),
        configResult.error.message,
      );
      process.exit(1);
    }

    const config = configResult.value;

    // Apply CLI options to config
    applyCliOptions(config, options);

    // Create database service
    const database = createDatabaseService(config);

    // Initialize database
    logInfo(chalk.blue("Initializing database..."));
    const initResult = await database.initialize(config);

    if (initResult.ok === false) {
      logError(
        chalk.red("Error initializing database:"),
        initResult.error.message,
      );
      process.exit(1);
    }

    // Reset database if requested
    if (options.reset === true) {
      logInfo(chalk.yellow("Resetting database..."));
      const resetResult = await database.reset();

      if (resetResult.ok === false) {
        logError(
          chalk.red("Error resetting database:"),
          resetResult.error.message,
        );
        process.exit(1);
      }
    }

    // Create server
    const server = createServer(config, database);

    // Start server
    const port = options.port
      ? parseInt(String(options.port), 10)
      : config.options?.port;
    logInfo(chalk.blue("Starting server..."));
    const startResult = await server.start(port);

    if (startResult.ok === false) {
      logError(chalk.red("Error starting server:"), startResult.error.message);
      process.exit(1);
    }

    // Check if interactive mode is enabled (default is true)
    const interactiveMode = options.interactive !== false;

    if (interactiveMode) {
      // Start interactive CLI
      const cli = new InteractiveCliManager(server, database, config);
      const cliResult = await cli.start();

      if (cliResult.ok === false) {
        logError(
          chalk.red("Error starting interactive CLI:"),
          cliResult.error.message,
        );
        // Continue with non-interactive mode if CLI fails
        runNonInteractiveMode(server, config);
      }
    } else {
      // Run in non-interactive mode
      runNonInteractiveMode(server, config);
    }
  } catch (error) {
    logError(
      chalk.red("Error:"),
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
};
