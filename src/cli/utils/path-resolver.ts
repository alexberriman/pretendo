import path from "path";
import { logInfo } from "./logger.js";
import chalk from "chalk";

/**
 * Resolves a file path or URL from user input
 * Handles repo URLs, remote URLs, and local file paths
 */
export const resolveFileLocation = async (
  file: string,
  skipPrompt = false,
): Promise<string> => {
  // Import required functions
  const { isUrl, isGitHubUrl, isRepoUrl, convertRepoUrlToGitHubUrl } =
    await import("../../config/parser.js");

  // Check if file is a repo URL (repo://example.yml)
  if (isRepoUrl(file)) {
    // Convert repo URL to GitHub URL for display purposes
    const githubUrl = convertRepoUrlToGitHubUrl(file);
    logInfo(chalk.blue("Loading API specification from repository:"), file);
    logInfo(chalk.gray(`(Using GitHub URL: ${githubUrl})`));

    // Keep the repo URL for processing
    return file;
  }

  // Check if file is a remote URL (http://, https://)
  if (isUrl(file)) {
    const isGitHub = isGitHubUrl(file);
    const shouldSkipPrompt = skipPrompt || isGitHub;

    if (shouldSkipPrompt) {
      logInfo(chalk.blue("Downloading API specification from:"), file);
      return file;
    }

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
      throw new Error("Download cancelled by user");
    }

    logInfo(chalk.blue("Downloading API specification from:"), file);
    return file;
  }

  // It's a local file path - resolve it
  const resolvedPath = path.resolve(process.cwd(), file);
  logInfo(chalk.blue("Loading API specification from:"), resolvedPath);
  return resolvedPath;
};
