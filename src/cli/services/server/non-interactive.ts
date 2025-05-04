import { ApiConfig } from "../../../types/index.js";
import { logError, logInfo, logWarn } from "../../utils/logger.js";
import { displayServerInfo } from "../../display/server-info.js";
import { displayApiResources } from "../../display/api-resources.js";
import { displayFooter } from "../../display/footer.js";
import chalk from "chalk";

/**
 * Interface for the server object
 */
interface ServerInstance {
  getUrl: () => string;
  stop: () => Promise<{ ok: boolean; error?: { message: string } }>;
}

/**
 * Runs the server in non-interactive mode
 * Displays server information and handles graceful shutdown
 */
export const runNonInteractiveMode = (
  server: ServerInstance,
  config: ApiConfig,
): void => {
  // Display server information
  displayServerInfo(server, config);

  // Display API resources
  displayApiResources(config);

  // Display footer with Ctrl+C instructions
  displayFooter(server.getUrl());

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    logWarn(chalk.yellow("\nShutting down server..."));

    const stopResult = await server.stop();

    if (stopResult.ok === false && stopResult.error) {
      logError(chalk.red("Error stopping server:"), stopResult.error.message);
      process.exit(1);
    }

    logInfo(chalk.green("Server stopped"));
    process.exit(0);
  });
};
