import chalk from "chalk";

/**
 * Utility functions for consistent logging throughout the application
 */

/**
 * Log an informational message to the console
 */
export const logInfo = (message: string, ...args: unknown[]): void => {
  console.log(message, ...args);
};

/**
 * Log a warning message to the console
 */
export const logWarn = (message: string, ...args: unknown[]): void => {
  console.warn(message, ...args);
};

/**
 * Log an error message to the console
 */
export const logError = (message: string, ...args: unknown[]): void => {
  console.error(message, ...args);
};

/**
 * Log a colorized section header
 */
export const logHeader = (message: string): void => {
  logInfo(chalk.blue.bold(`\n${message}\n`));
};

/**
 * Log a success message
 */
export const logSuccess = (message: string, ...args: unknown[]): void => {
  console.log(chalk.green(message), ...args);
};
