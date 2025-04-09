import readline from "readline";
import {
  ApiConfig,
  DatabaseService,
  Server,
  Result,
  ok,
  err,
} from "../../types/index.js";
import { OutputFormatter } from "../ui/formatter.js";
import { theme } from "../ui/theme.js";
import {
  handleHelp,
  handleRoutes,
  handleConfig,
  handleStats,
  handleReset,
  handleBackup,
  handleRestore,
  handleRequest,
  handleClear,
  handleLogs,
} from "../commands/index.js";

export class InteractiveCliManager {
  private server: Server;
  private database: DatabaseService;
  private config: ApiConfig;
  private rl: readline.Interface;
  private commands: Map<string, (args: string[]) => Promise<void>>;
  private running: boolean = false;

  constructor(server: Server, database: DatabaseService, config: ApiConfig) {
    this.server = server;
    this.database = database;
    this.config = config;

    // Create readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: theme.prompt("pretendo> "),
      completer: this.autocompleteHandler.bind(this),
    });

    // Register commands
    this.commands = new Map();
    this.registerCommands();
  }

  // Register all command handlers
  private registerCommands(): void {
    this.commands.set("help", async () => await handleHelp());
    this.commands.set("routes", async () => await handleRoutes(this.config));
    this.commands.set("config", async () => await handleConfig(this.config));
    this.commands.set("stats", async () => await handleStats(this.database));
    this.commands.set("reset", async () => await handleReset(this.database));
    this.commands.set("backup", async () => await handleBackup(this.database));
    this.commands.set(
      "restore",
      async () => await handleRestore(this.database),
    );
    this.commands.set(
      "request",
      async (args) => await handleRequest(args, this.server),
    );
    this.commands.set("clear", async () => await handleClear());
    this.commands.set(
      "logs",
      async (args) => await handleLogs(args, this.server),
    );
    this.commands.set("exit", async () => await this.exit());
  }

  // Handle autocomplete functionality
  private autocompleteHandler(line: string): [string[], string] {
    const completions = Array.from(this.commands.keys());
    const hits = completions.filter((c) => c.startsWith(line));

    // Show all completions if none found
    return [hits.length ? hits : completions, line];
  }

  // Start the interactive CLI
  async start(): Promise<Result<void, Error>> {
    try {
      // Display initial server info
      console.log(
        OutputFormatter.formatServerOutput(this.config, this.server.getUrl()),
      );
      console.log(
        "\n" +
          theme.info(
            "Interactive mode enabled. Type 'help' for available commands.",
          ),
      );

      this.running = true;

      // Set up event handlers
      this.rl.on("line", async (line) => {
        if (!this.running) return;

        const trimmedLine = line.trim();
        if (!trimmedLine) {
          this.rl.prompt();
          return;
        }

        const [command, ...args] = trimmedLine.split(" ");
        const handler = this.commands.get(command.toLowerCase());

        if (handler) {
          try {
            await handler(args);
          } catch (error) {
            console.error(
              theme.error("Error:"),
              error instanceof Error ? error.message : String(error),
            );
          }
        } else {
          console.log(
            theme.error(
              `Unknown command: ${command}. Type 'help' for available commands.`,
            ),
          );
        }

        if (this.running) {
          this.rl.prompt();
        }
      });

      this.rl.on("SIGINT", async () => {
        // Handle Ctrl+C by calling exit
        await this.exit();
      });

      // Start prompting
      this.rl.prompt();

      return ok(undefined);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error(`Failed to start interactive CLI: ${String(error)}`),
      );
    }
  }

  // Exit the CLI and shut down the server
  async exit(): Promise<void> {
    if (!this.running) return;

    this.running = false;
    console.log(theme.warning("\nShutting down server..."));

    // Close readline interface
    this.rl.close();

    // Stop server
    const stopResult = await this.server.stop();

    if (stopResult.ok === false) {
      console.error(
        theme.error("Error stopping server:"),
        stopResult.error.message,
      );
      process.exit(1);
    }

    console.log(theme.success("Server stopped"));
    process.exit(0);
  }
}
