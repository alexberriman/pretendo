import { ApiConfig } from "../../types/index.js";
import Table from "cli-table3";
import {
  theme,
  logo,
  formatEndpoint,
  formatSection,
  formatSubSection,
  formatKeyValue,
  formatHeaderBox,
} from "./theme.js";

export class OutputFormatter {
  // Format the entire server output
  static formatServerOutput(config: ApiConfig, serverUrl: string): string {
    const output: string[] = [];

    // Add logo
    output.push(logo());

    // Add server info section
    output.push(formatHeaderBox("Server running"));
    output.push(formatSection("Server Information"));
    output.push(formatKeyValue("URL", serverUrl));
    output.push(formatKeyValue("Mode", process.env.NODE_ENV || "development"));

    // Add configuration section
    output.push(formatSection("API Configuration"));

    const {
      port = 3000,
      host = "localhost",
      corsEnabled = true,
      dbPath = "./db.json",
      defaultPageSize = 10,
      maxPageSize = 100,
      latency,
      errorSimulation,
    } = config.options || {};

    output.push(formatKeyValue("Port", port));
    output.push(formatKeyValue("Host", host));
    output.push(formatKeyValue("CORS", corsEnabled));
    output.push(formatKeyValue("Database", dbPath));
    output.push(
      formatKeyValue("Page Size", `${defaultPageSize} (max: ${maxPageSize})`),
    );

    if (latency?.enabled) {
      const latencyDesc = latency.fixed
        ? `fixed ${latency.fixed}ms`
        : `random ${latency.min || 0}-${latency.max || 1000}ms`;
      output.push(formatKeyValue("Latency", latencyDesc));
    }

    if (errorSimulation?.enabled) {
      output.push(
        formatKeyValue("Error Rate", `${(errorSimulation.rate || 0) * 100}%`),
      );
    }

    // Add resources section
    output.push(formatSection("API Resources"));

    config.resources.forEach((resource) => {
      const resourceName = resource.name;
      output.push(formatSubSection(resourceName.toUpperCase()));

      // Standard REST endpoints
      output.push(
        formatEndpoint("GET", `/${resourceName}`, `List all ${resourceName}`),
      );
      output.push(
        formatEndpoint(
          "GET",
          `/${resourceName}/:id`,
          `Get a single ${resourceName}`,
        ),
      );
      output.push(
        formatEndpoint(
          "POST",
          `/${resourceName}`,
          `Create a new ${resourceName}`,
        ),
      );
      output.push(
        formatEndpoint(
          "PUT",
          `/${resourceName}/:id`,
          `Update a ${resourceName}`,
        ),
      );
      output.push(
        formatEndpoint(
          "PATCH",
          `/${resourceName}/:id`,
          `Partially update a ${resourceName}`,
        ),
      );
      output.push(
        formatEndpoint(
          "DELETE",
          `/${resourceName}/:id`,
          `Delete a ${resourceName}`,
        ),
      );

      // Relationship endpoints
      const relationships = resource.relationships;
      if (relationships && relationships.length > 0) {
        relationships.forEach((rel) => {
          const relatedResource = rel.resource;
          if (rel.type === "hasMany" || rel.type === "belongsTo") {
            output.push(
              formatEndpoint(
                "GET",
                `/${resourceName}/:id/${relatedResource}`,
                `Get related ${relatedResource}`,
              ),
            );
          }
        });
      }
    });

    // Add special endpoints section
    if (config.options?.auth?.enabled === true) {
      const authEndpoint = config.options.auth.authEndpoint || "/auth/login";
      output.push(formatSection("Auth Endpoints"));
      output.push(formatEndpoint("POST", authEndpoint, "Login"));
      output.push(formatEndpoint("POST", "/auth/logout", "Logout"));
    }

    // Add admin endpoints
    output.push(formatSection("Admin Endpoints"));
    output.push(
      formatEndpoint("POST", "/__reset", "Reset database to initial state"),
    );
    output.push(formatEndpoint("POST", "/__backup", "Create database backup"));
    output.push(formatEndpoint("POST", "/__restore", "Restore from backup"));

    return output.join("\n");
  }

  // Format database stats
  static formatDatabaseStats(database: {
    getStats?: () => Record<string, { count: number; lastModified: number }>;
  }): string {
    const output: string[] = [];
    output.push(formatSection("Database Statistics"));

    if (!database || !database.getStats) {
      return (
        output.join("\n") +
        "\n" +
        theme.error("  Database statistics not available")
      );
    }

    const stats = database.getStats();
    const table = new Table({
      head: [
        theme.heading("Resource"),
        theme.heading("Records"),
        theme.heading("Last Modified"),
      ],
      style: {
        head: [], // No additional style needed as we colorize the headers directly
        border: [],
      },
    });

    Object.entries(stats).forEach(
      ([resource, data]: [string, { count: number; lastModified: number }]) => {
        table.push([
          theme.text(resource),
          theme.accent(data.count.toString()),
          theme.dimText(new Date(data.lastModified).toLocaleString()),
        ]);
      },
    );

    output.push(table.toString());
    return output.join("\n");
  }

  // Format help menu
  static formatHelpMenu(): string {
    const output: string[] = [];
    output.push(formatSection("Available Commands"));

    // Command list without using a table
    const commands = [
      { cmd: "help", desc: "Show this help menu" },
      { cmd: "routes", desc: "List all API routes" },
      { cmd: "config", desc: "Show current configuration" },
      { cmd: "stats", desc: "Show database statistics" },
      { cmd: "reset", desc: "Reset the database to initial state" },
      { cmd: "backup", desc: "Create a database backup" },
      { cmd: "restore", desc: "Restore from the last backup" },
      { cmd: "request", desc: "Make a test request to an endpoint" },
      { cmd: "clear", desc: "Clear the console" },
      { cmd: "exit", desc: "Stop the server and exit" },
    ];

    // Format each command with proper spacing
    commands.forEach(({ cmd, desc }) => {
      output.push(`  ${theme.command(cmd.padEnd(10))} ${theme.text(desc)}`);
    });

    output.push("\n" + theme.info("Press Tab for autocompletion of commands"));

    return output.join("\n");
  }
}
