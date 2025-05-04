import chalk from "chalk";
import { ApiConfig } from "../../types/index.js";
import { logInfo } from "../utils/logger.js";

/**
 * Displays server information and configuration in non-interactive mode
 */
export const displayServerInfo = (
  server: {
    getUrl: () => string;
  },
  config: ApiConfig,
): void => {
  // Create a fancy server header
  const serverUrl = server.getUrl();
  const headerLine = "═".repeat(serverUrl.length + 24);

  logInfo("\n" + chalk.bold.cyan(headerLine));
  logInfo(
    chalk.bold.cyan("║") +
      chalk.bold.yellow(" 🔥 PRETENDO SERVER 🔥 ") +
      chalk.bold.cyan("║"),
  );
  logInfo(chalk.bold.cyan(headerLine));

  logInfo(chalk.bold.green("\n🚀 Server Information:"));
  logInfo(chalk.white("• URL:         ") + chalk.magenta(serverUrl));
  logInfo(
    chalk.white("• Mode:        ") +
      chalk.magenta(process.env.NODE_ENV || "development"),
  );

  // Log all active options
  logInfo(chalk.bold.green("\n⚙️  API Configuration:"));

  // Extract and display options with nice formatting
  const configPort = config.options?.port || 3000;
  const configHost = config.options?.host || "localhost";
  const corsEnabled = config.options?.corsEnabled !== false;
  const dbPath = config.options?.dbPath || "db.json";
  const defaultPageSize = config.options?.defaultPageSize || 10;
  const maxPageSize = config.options?.maxPageSize || 100;

  logInfo(chalk.white("• Port:        ") + chalk.yellow(configPort));
  logInfo(chalk.white("• Host:        ") + chalk.yellow(configHost));
  logInfo(
    chalk.white("• CORS:        ") +
      (corsEnabled ? chalk.green("enabled") : chalk.red("disabled")),
  );
  logInfo(chalk.white("• Database:    ") + chalk.yellow(dbPath));
  logInfo(
    chalk.white("• Page Size:   ") +
      chalk.yellow(`${defaultPageSize} (max: ${maxPageSize})`),
  );

  const latency = config.options?.latency;
  if (latency?.enabled) {
    const latencyDesc = latency.fixed
      ? `fixed ${latency.fixed}ms`
      : `random ${latency.min || 0}-${latency.max || 1000}ms`;
    logInfo(chalk.white("• Latency:     ") + chalk.yellow(latencyDesc));
  }

  const errorSimulation = config.options?.errorSimulation;
  if (errorSimulation?.enabled) {
    logInfo(
      chalk.white("• Error Rate:  ") +
        chalk.yellow(`${(errorSimulation.rate || 0) * 100}%`),
    );
  }
};
