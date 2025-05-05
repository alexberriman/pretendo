import { createMockApi } from "../../index.js";
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

    // Get the port from options or config
    const port = options.port
      ? parseInt(String(options.port), 10)
      : config.options?.port;

    // Use createMockApi to create and start the server
    logInfo(chalk.blue("Initializing server..."));

    // Create options for the mock API
    const mockApiOptions = {
      spec: config,
      port: port,
      // Handle reset option
      resetDatabase: options.reset === true,
    };

    // Create and start the mock API
    const result = await createMockApi(mockApiOptions);

    if (!result.ok) {
      logError(chalk.red("Error creating mock API:"), result.error.message);
      process.exit(1);
    }

    const server = result.value;

    // Check if interactive mode is enabled (default is true)
    const interactiveMode = options.interactive !== false;

    if (interactiveMode) {
      // Start interactive CLI - use null for database as it's already encapsulated in the server
      const cli = new InteractiveCliManager(server, null, config);
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
