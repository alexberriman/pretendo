import { Server, LogEntry } from "../../types/index.js";
import { theme } from "../ui/theme.js";
import chalk from "chalk";
import Table from "cli-table3";

// Function to format status code with color
const formatStatus = (status: number): string => {
  if (status >= 500) return chalk.red(status.toString());
  if (status >= 400) return chalk.yellow(status.toString());
  if (status >= 300) return chalk.cyan(status.toString());
  if (status >= 200) return chalk.green(status.toString());
  return chalk.gray(status.toString());
};

// Function to format HTTP method with color
const formatMethod = (method: string): string => {
  switch (method.toUpperCase()) {
    case "GET":
      return chalk.blue(method);
    case "POST":
      return chalk.green(method);
    case "PUT":
      return chalk.yellow(method);
    case "PATCH":
      return chalk.magenta(method);
    case "DELETE":
      return chalk.red(method);
    default:
      return chalk.gray(method);
  }
};

// Function to format response time with color based on duration
const formatResponseTime = (time: number): string => {
  if (time > 1000) return chalk.red(`${time.toFixed(2)}ms`);
  if (time > 500) return chalk.yellow(`${time.toFixed(2)}ms`);
  if (time > 100) return chalk.cyan(`${time.toFixed(2)}ms`);
  return chalk.green(`${time.toFixed(2)}ms`);
};

// Function to format timestamp
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return chalk.gray(
    `${date.toLocaleTimeString()} ${date.toLocaleDateString()}`,
  );
};

// Handle 'logs' command for listing recent logs
export const handleLogs = async (
  args: string[],
  server: Server,
): Promise<void> => {
  const options: {
    method?: string;
    status?: number;
    url?: string;
    limit?: number;
  } = {};
  let showHelp = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      showHelp = true;
      break;
    } else if (arg === "--method" || arg === "-m") {
      options.method = args[++i];
    } else if (arg === "--status" || arg === "-s") {
      options.status = parseInt(args[++i], 10);
    } else if (arg === "--url" || arg === "-u") {
      options.url = args[++i];
    } else if (arg === "--limit" || arg === "-l") {
      options.limit = parseInt(args[++i], 10);
    }
  }

  if (showHelp) {
    console.log(theme.heading("\nLog Explorer Commands:"));
    console.log(
      `  ${theme.command("logs")} - Show recent request logs (default: last 10)`,
    );
    console.log(`  ${theme.command("logs -l 20")} - Show last 20 logs`);
    console.log(
      `  ${theme.command("logs -m GET")} - Filter logs by HTTP method (GET, POST, etc.)`,
    );
    console.log(
      `  ${theme.command("logs -s 404")} - Filter logs by status code`,
    );
    console.log(
      `  ${theme.command("logs -u /users")} - Filter logs containing a specific URL path`,
    );
    console.log(`  ${theme.command("logs --clear")} - Clear all stored logs`);
    console.log(
      `  ${theme.command("logs -s 4xx")} - Show all 4xx errors (400-499)`,
    );
    console.log(
      `  ${theme.command("logs -s 5xx")} - Show all 5xx errors (500-599)`,
    );
    console.log();
    return;
  }

  // Check for clear command
  if (args.includes("--clear")) {
    server.logs.clearLogs();
    console.log(theme.success("All logs have been cleared."));
    return;
  }

  // Handle status code ranges (4xx, 5xx)
  if (options.status && options.status.toString().endsWith("xx")) {
    const statusPrefix = parseInt(options.status.toString()[0], 10);
    delete options.status; // Remove the status filter

    // Get all logs
    let logs = server.logs.getLogs();

    // Apply other filters (method, url)
    if (options.method) {
      logs = logs.filter(
        (log) => log.method.toLowerCase() === options.method?.toLowerCase(),
      );
    }

    if (options.url) {
      logs = logs.filter((log) => log.url.includes(options.url as string));
    }

    // Apply status range filter manually
    logs = logs.filter((log) => Math.floor(log.status / 100) === statusPrefix);

    // Apply limit
    if (options.limit && options.limit > 0) {
      logs = logs.slice(0, options.limit);
    } else {
      logs = logs.slice(0, 10); // Default limit
    }

    displayLogs(logs);
    return;
  }

  // Set default limit if not specified
  if (!options.limit) {
    options.limit = 10;
  }

  // Get filtered logs
  const logs = server.logs.getFilteredLogs(options);

  // Display logs
  displayLogs(logs);
};

// Helper function to display logs in a formatted table
function displayLogs(logs: LogEntry[]): void {
  if (logs.length === 0) {
    console.log(theme.info("\nNo logs match your filter criteria."));
    return;
  }

  // Create fancy table with UTF8 borders
  const table = new Table({
    head: [
      chalk.bold("Timestamp"),
      chalk.bold("Method"),
      chalk.bold("URL"),
      chalk.bold("Status"),
      chalk.bold("Time"),
    ],
    style: {
      head: [], // No styling for head
      border: [], // No styling for border
    },
  });

  // Add rows to table
  logs.forEach((log) => {
    table.push([
      formatTimestamp(log.timestamp),
      formatMethod(log.method),
      log.url,
      formatStatus(log.status),
      formatResponseTime(log.responseTime),
    ]);
  });

  console.log(table.toString());
  console.log(theme.info(`\nDisplaying ${logs.length} log entries.`));
  console.log(
    theme.dimText(
      `Use '${theme.command("logs --help")}' to see more filtering options.`,
    ),
  );
}
