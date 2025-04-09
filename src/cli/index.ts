#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import path from "path";
import { createDatabaseService } from "../database/index.js";
import { parseFromYaml } from "../config/index.js";
import { ApiConfig } from "../types/index.js";
import { createServer } from "../server/index.js";
import { InteractiveCliManager } from "./interactive/index.js";

// Define version manually since we can't directly import from package.json in ECMAScript modules
const version = "1.0.0";

// Utility function to safely log (silence ESLint warnings)
// Special case: console.log allowed for CLI output
const logInfo = (message: string, ...args: unknown[]): void => {
  // eslint-disable-next-line no-console
  console.log(message, ...args);
};

const logWarn = (message: string, ...args: unknown[]): void => {
  console.warn(message, ...args);
};

const logError = (message: string, ...args: unknown[]): void => {
  console.error(message, ...args);
};

const program = new Command();

program
  .name("pretendo")
  .description("A flexible REST API mock server for frontend development")
  .version(version);

program
  .command("start")
  .description("Start the mock API server")
  .argument(
    "<file>",
    "Path or URL to the API specification file (YAML or JSON)",
  )
  .option("-p, --port <number>", "Port to run the server on")
  .option("-h, --host <string>", "Host to run the server on")
  .option("--no-cors", "Disable CORS support")
  .option("-d, --db <path>", "Path to the database file")
  .option("--delay <ms>", "Add fixed delay to all responses (in milliseconds)")
  .option(
    "--error-rate <rate>",
    "Add random errors with specified probability (0-1)",
  )
  .option("--reset", "Reset the database before starting")
  .option("--no-interactive", "Disable interactive CLI mode")
  .option("--no-prompt", "Skip the prompt when downloading from a URL")
  .action(async (file: string, options: Record<string, unknown>) => {
    try {
      // Import required functions
      const { isUrl, isGitHubUrl } = await import("../config/parser.js");

      // Check if file is a URL
      let filePathOrUrl = file;
      if (isUrl(file)) {
        const isGitHub = isGitHubUrl(file);
        const skipPrompt = options.prompt === false || isGitHub;

        if (skipPrompt) {
          logInfo(chalk.blue("Downloading API specification from:"), file);
        } else {
          // Prompt the user to confirm download
          const readline = await import("readline");
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          const confirm = await new Promise<boolean>((resolve) => {
            rl.question(
              chalk.yellow(
                `Do you want to download the API schema from ${file}? (y/N): `,
              ),
              (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === "y");
              },
            );
          });

          if (!confirm) {
            logError(chalk.red("Download cancelled by user"));
            process.exit(0);
          }

          logInfo(chalk.blue("Downloading API specification from:"), file);
        }
      } else {
        // Resolve local file path
        filePathOrUrl = path.resolve(process.cwd(), file);
        logInfo(chalk.blue("Loading API specification from:"), filePathOrUrl);
      }

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
        logError(
          chalk.red("Error starting server:"),
          startResult.error.message,
        );
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
  });

// Function to run in non-interactive mode
function runNonInteractiveMode(
  server: {
    getUrl: () => string;
    stop: () => Promise<{ ok: boolean; error?: { message: string } }>;
  },
  config: ApiConfig,
): void {
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

  // Log available resources with routes
  logInfo(chalk.bold.green("\n📚 API Resources:"));

  config.resources.forEach((resource: { name: string }) => {
    const resourceName = resource.name;
    logInfo(chalk.bold.cyan(`\n• ${resourceName.toUpperCase()}`));

    // Show all RESTful routes for each resource
    logInfo(
      `  ${chalk.blue("GET")}    ${chalk.white(`/${resourceName}`)}           ${chalk.gray("- List all " + resourceName)}`,
    );
    logInfo(
      `  ${chalk.blue("GET")}    ${chalk.white(`/${resourceName}/:id`)}       ${chalk.gray("- Get a single " + resourceName)}`,
    );
    logInfo(
      `  ${chalk.green("POST")}   ${chalk.white(`/${resourceName}`)}           ${chalk.gray("- Create a new " + resourceName)}`,
    );
    logInfo(
      `  ${chalk.yellow("PUT")}    ${chalk.white(`/${resourceName}/:id`)}       ${chalk.gray("- Update a " + resourceName)}`,
    );
    logInfo(
      `  ${chalk.yellow("PATCH")}  ${chalk.white(`/${resourceName}/:id`)}       ${chalk.gray("- Partially update a " + resourceName)}`,
    );
    logInfo(
      `  ${chalk.red("DELETE")} ${chalk.white(`/${resourceName}/:id`)}       ${chalk.gray("- Delete a " + resourceName)}`,
    );

    // Add relationship routes if resource has relationships
    const relationships = config.resources.find(
      (r) => r.name === resourceName,
    )?.relationships;
    if (relationships && relationships.length > 0) {
      relationships.forEach((rel) => {
        const relatedResource = rel.resource;
        if (rel.type === "hasMany") {
          logInfo(
            `  ${chalk.blue("GET")}    ${chalk.white(`/${resourceName}/:id/${relatedResource}`)} ${chalk.gray("- Get related " + relatedResource)}`,
          );
        } else if (rel.type === "belongsTo") {
          logInfo(
            `  ${chalk.blue("GET")}    ${chalk.white(`/${resourceName}/:id/${relatedResource}`)} ${chalk.gray("- Get related " + relatedResource)}`,
          );
        }
      });
    }
  });

  // Log special endpoints
  if (config.options?.auth?.enabled === true) {
    const authEndpoint = config.options.auth.authEndpoint || "/auth/login";
    logInfo(chalk.bold.green("\n🔐 Auth Endpoints:"));
    logInfo(
      `  ${chalk.green("POST")}   ${chalk.white(authEndpoint)}     ${chalk.gray("- Login")}`,
    );
    logInfo(
      `  ${chalk.green("POST")}   ${chalk.white("/auth/logout")}   ${chalk.gray("- Logout")}`,
    );
  }

  logInfo(chalk.bold.green("\n⚡ Admin Endpoints:"));
  logInfo(
    `  ${chalk.green("POST")}   ${chalk.white("/__reset")}        ${chalk.gray("- Reset database to initial state")}`,
  );
  logInfo(
    `  ${chalk.green("POST")}   ${chalk.white("/__backup")}       ${chalk.gray("- Create database backup")}`,
  );
  logInfo(
    `  ${chalk.green("POST")}   ${chalk.white("/__restore")}      ${chalk.gray("- Restore from backup")}`,
  );

  // Fancy footer
  logInfo(chalk.bold.cyan("\n" + headerLine));
  logInfo(chalk.bold.yellow("✨ Server is ready to accept connections ✨"));
  logInfo(chalk.bold.cyan(headerLine));
  logInfo(chalk.blue("\nPress Ctrl+C to stop the server"));

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
}

// Apply CLI options to config
function applyCliOptions(
  config: ApiConfig,
  options: Record<string, unknown>,
): void {
  // Ensure options object exists
  if (!config.options) {
    config.options = {};
  }

  // Apply port
  if (options.port) {
    config.options.port = parseInt(String(options.port), 10);
  }

  // Apply host
  if (options.host) {
    config.options.host = String(options.host);
  }

  // Apply CORS setting
  if (options.cors === false) {
    config.options.corsEnabled = false;
  }

  // Apply database path
  if (options.db) {
    config.options.dbPath = String(options.db);
  }

  // Apply delay
  if (options.delay) {
    const delay = parseInt(String(options.delay), 10);

    if (!config.options.latency) {
      config.options.latency = { enabled: true };
    }

    config.options.latency.enabled = true;
    config.options.latency.fixed = delay;
  }

  // Apply error rate
  if (options.errorRate) {
    const rate = parseFloat(String(options.errorRate));

    if (!config.options.errorSimulation) {
      config.options.errorSimulation = { enabled: true };
    }

    config.options.errorSimulation.enabled = true;
    config.options.errorSimulation.rate = Math.min(Math.max(rate, 0), 1); // Clamp between 0 and 1
  }
}

// Run the program
program.parse(process.argv);
