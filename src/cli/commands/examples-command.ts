import chalk from "chalk";
import { logInfo, logHeader } from "../utils/logger.js";
import { EXAMPLES } from "../config/constants.js";

/**
 * Handler for the 'examples' command
 * Lists available example API specifications from the repository
 */
export const examplesCommandHandler = (): void => {
  logHeader("📋 Available Example API Specifications");

  // List the examples with their descriptions
  EXAMPLES.forEach((example) => {
    logInfo(chalk.yellow(`repo://${example.name}`));
    logInfo(`  ${chalk.gray(example.description)}`);
    logInfo("");
  });

  // Show usage instructions
  logInfo(chalk.blue.bold("Usage:"));
  logInfo(`  pretendo start repo://EXAMPLE_NAME`);
  logInfo(
    `  Example: ${chalk.green("pretendo start repo://simple-api.yml")}\n`,
  );
};
