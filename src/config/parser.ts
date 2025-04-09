import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";
import { ApiConfig } from "../types/index.js";
import { Result, err, ok } from "../types/result.js";
import { mergeConfig } from "./validator.js";
import https from "https";
import http from "http";
import { URL } from "url";

/**
 * Downloads content from a URL
 */
export const downloadFromUrl = async (
  url: string,
): Promise<Result<string, Error>> => {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === "https:" ? https : http;

    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          resolve(
            err(
              new Error(
                `Failed to download from URL: Status code ${response.statusCode}`,
              ),
            ),
          );
          return;
        }

        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          resolve(ok(data));
        });
      })
      .on("error", (error) => {
        resolve(err(error));
      });
  });
};

/**
 * Determines if a string is a URL
 */
export const isUrl = (input: string): boolean => {
  try {
    // Check for repo:// format
    if (input.startsWith("repo://")) {
      return true;
    }

    // Check standard URLs
    new URL(input);
    return true;
  } catch {
    return false;
  }
};

/**
 * Determines if a URL is from GitHub
 */
export const isGitHubUrl = (url: string): boolean => {
  return url.includes("github.com") || url.includes("githubusercontent.com");
};

/**
 * Determines if a string is a repository URL (repo://)
 */
export const isRepoUrl = (input: string): boolean => {
  return input.startsWith("repo://");
};

/**
 * Converts a repository URL (repo://) to a GitHub raw URL
 */
export const convertRepoUrlToGitHubUrl = (repoUrl: string): string => {
  if (!isRepoUrl(repoUrl)) {
    throw new Error("Not a valid repository URL");
  }

  // Extract the file path from the repo URL (everything after repo://)
  const filePath = repoUrl.substring(7); // 7 = "repo://".length

  // Construct the GitHub raw URL
  // Uses the current repository's main branch
  return `https://raw.githubusercontent.com/alexberriman/pretendo/refs/heads/main/examples/${filePath}`;
};

/**
 * Parses content based on its extension or format
 */
export const parseContent = (
  content: string,
  format: string,
): Result<ApiConfig, Error> => {
  try {
    if (format === "yml" || format === "yaml") {
      const config = yaml.load(content) as ApiConfig;
      return mergeConfig(config);
    } else if (format === "json") {
      const config = JSON.parse(content) as ApiConfig;
      return mergeConfig(config);
    } else {
      return err(
        new Error(
          `Unsupported file extension: ${format}. Only .yml, .yaml, and .json are supported.`,
        ),
      );
    }
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error(`Failed to parse content: ${String(error)}`),
    );
  }
};

export const parseFromYaml = async (
  filePathOrUrl: string,
): Promise<Result<ApiConfig, Error>> => {
  try {
    let fileContent: string;
    let extension: string;

    // Check if input is a repo URL
    if (isRepoUrl(filePathOrUrl)) {
      // Convert repo URL to GitHub raw URL
      const githubUrl = convertRepoUrlToGitHubUrl(filePathOrUrl);

      // Download the content from GitHub
      const downloadResult = await downloadFromUrl(githubUrl);
      if (!downloadResult.ok) {
        return err(downloadResult.error);
      }

      fileContent = downloadResult.value;
      // Extract extension from the file path
      const filePath = filePathOrUrl.substring(7); // 7 = "repo://".length
      extension = path.extname(filePath).toLowerCase().replace(".", "");
    }
    // Check if input is a standard URL
    else if (isUrl(filePathOrUrl)) {
      const downloadResult = await downloadFromUrl(filePathOrUrl);
      if (!downloadResult.ok) {
        return err(downloadResult.error);
      }

      fileContent = downloadResult.value;
      // Extract extension from URL path
      const urlPath = new URL(filePathOrUrl).pathname;
      extension = path.extname(urlPath).toLowerCase().replace(".", "");
    } else {
      // Handle local file path
      fileContent = await fs.readFile(filePathOrUrl, "utf-8");
      extension = path.extname(filePathOrUrl).toLowerCase().replace(".", "");
    }

    return parseContent(fileContent, extension);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error(`Failed to parse config file: ${String(error)}`),
    );
  }
};

export const parseFromObject = (
  configObject: unknown,
): Result<ApiConfig, Error> => {
  if (typeof configObject !== "object" || configObject === null) {
    return err(new Error("Configuration must be a non-null object"));
  }

  try {
    return mergeConfig(configObject as ApiConfig);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error(`Failed to parse config object: ${String(error)}`),
    );
  }
};

export const parseFromString = (
  content: string,
  format: "yaml" | "json" = "yaml",
): Result<ApiConfig, Error> => {
  try {
    let parsedConfig: unknown;

    if (format === "yaml") {
      parsedConfig = yaml.load(content);
    } else if (format === "json") {
      parsedConfig = JSON.parse(content);
    } else {
      return err(
        new Error(
          `Unsupported format: ${format}. Only 'yaml' and 'json' are supported.`,
        ),
      );
    }

    return parseFromObject(parsedConfig);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error(`Failed to parse config string: ${String(error)}`),
    );
  }
};
