import { Command } from "commander";
import { VERSION } from "../config/constants.js";
import { examplesCommandHandler } from "../commands/examples-command.js";
import { startCommandHandler } from "../commands/start-command.js";

/**
 * Initializes the CLI program with all commands
 */
export const initializeProgram = (): Command => {
  const program = new Command();

  // Setup the main program info
  program
    .name("pretendo")
    .description("A flexible REST API mock server for frontend development")
    .version(VERSION);

  // Add examples command
  program
    .command("examples")
    .description(
      "List available example API specifications from the repository",
    )
    .action(examplesCommandHandler);

  // Add start command
  program
    .command("start")
    .description("Start the mock API server")
    .argument(
      "<file>",
      "Path or URL to the API specification file (YAML or JSON). Use repo:// prefix to load from repository examples.",
    )
    .option("-p, --port <number>", "Port to run the server on")
    .option("-h, --host <string>", "Host to run the server on")
    .option("--no-cors", "Disable CORS support")
    .option("-d, --db <path>", "Path to the database file")
    .option(
      "--delay <ms>",
      "Add fixed delay to all responses (in milliseconds)",
    )
    .option(
      "--error-rate <rate>",
      "Add random errors with specified probability (0-1)",
    )
    .option("--reset", "Reset the database before starting")
    .option("--no-interactive", "Disable interactive CLI mode")
    .option("--no-prompt", "Skip the prompt when downloading from a URL")
    .action(startCommandHandler);

  return program;
};
