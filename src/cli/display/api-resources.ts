import chalk from "chalk";
import { ApiConfig } from "../../types/index.js";
import { logInfo } from "../utils/logger.js";

/**
 * Displays available API resources and their endpoints
 */
export const displayApiResources = (config: ApiConfig): void => {
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
        if (rel.type === "hasMany" || rel.type === "belongsTo") {
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
};
