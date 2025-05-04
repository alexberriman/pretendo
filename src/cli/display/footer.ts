import chalk from "chalk";
import { logInfo } from "../utils/logger.js";

/**
 * Displays the server footer with Ctrl+C instructions
 */
export const displayFooter = (serverUrl: string): void => {
  const headerLine = "═".repeat(serverUrl.length + 24);

  // Fancy footer
  logInfo(chalk.bold.cyan("\n" + headerLine));
  logInfo(chalk.bold.yellow("✨ Server is ready to accept connections ✨"));
  logInfo(chalk.bold.cyan(headerLine));
  logInfo(chalk.blue("\nPress Ctrl+C to stop the server"));
};
