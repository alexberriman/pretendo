import chalk from "chalk";
import figlet from "figlet";

// Define UI color theme for consistent styling
export const theme = {
  // Primary colors
  primary: chalk.hex("#FF6B6B"),
  secondary: chalk.hex("#4ECDC4"),
  accent: chalk.hex("#FFE66D"),

  // Status colors
  success: chalk.hex("#6BFF8A"),
  warning: chalk.hex("#FFD166"),
  error: chalk.hex("#FF6B6B"),
  info: chalk.hex("#6BC5FF"),

  // Text styles
  heading: chalk.bold.hex("#FF6B6B"),
  subheading: chalk.bold.hex("#4ECDC4"),
  text: chalk.white,
  dimText: chalk.gray,

  // HTTP methods
  get: chalk.blue,
  post: chalk.green,
  put: chalk.yellow,
  patch: chalk.magenta,
  delete: chalk.red,

  // UI elements
  border: chalk.cyan,
  highlight: chalk.hex("#FFD166").bold,
  prompt: chalk.hex("#6BFF8A"),
  command: chalk.hex("#6BC5FF").bold,
};

export const logo = (): string => {
  const logoText = figlet.textSync("PRETENDO", {
    font: "ANSI Shadow",
    horizontalLayout: "default",
    verticalLayout: "default",
  });

  // Add color to the logo with a gradient effect
  const colorizedLines = logoText.split("\n").map((line, index) => {
    const ratio = index / 8; // Assuming approx 8 lines in the figlet output
    if (ratio < 0.33) {
      return theme.primary(line);
    } else if (ratio < 0.66) {
      return theme.accent(line);
    } else {
      return theme.secondary(line);
    }
  });

  return colorizedLines.join("\n");
};

export const formatEndpoint = (
  method: string,
  endpoint: string,
  description: string,
): string => {
  const methodMap: Record<string, string> = {
    GET: theme.get("GET"),
    POST: theme.post("POST"),
    PUT: theme.put("PUT"),
    PATCH: theme.patch("PATCH"),
    DELETE: theme.delete("DELETE"),
  };

  const methodStr = methodMap[method.toUpperCase()] || theme.text(method);

  // Pad method to align endpoints
  const paddedMethod =
    method.length < 6
      ? `${methodStr}${" ".repeat(6 - method.length)}`
      : methodStr;

  return `  ${paddedMethod} ${theme.text(endpoint.padEnd(30))} ${theme.dimText(description)}`;
};

export const formatSection = (title: string): string => {
  return `\n${theme.heading(title)}`;
};

export const formatSubSection = (title: string): string => {
  return theme.subheading(`  ${title}`);
};

export const formatKeyValue = (
  key: string,
  value: string | number | boolean,
): string => {
  const formattedValue =
    typeof value === "boolean"
      ? value
        ? theme.success("enabled")
        : theme.error("disabled")
      : typeof value === "number"
        ? theme.accent(value.toString())
        : theme.text(value.toString());

  return `  ${theme.dimText(key.padEnd(15))} ${formattedValue}`;
};

export const formatHeaderBox = (text: string): string => {
  // Simple format without borders
  return theme.highlight(`🚀 ${text}`);
};

export const formatCommandHelp = (
  command: string,
  description: string,
): string => {
  return `  ${theme.command(command.padEnd(15))} ${theme.text(description)}`;
};
