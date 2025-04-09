import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";
import { ApiConfig } from "../types/index.js";
import { Result, err } from "../types/result.js";
import { mergeConfig } from "./validator.js";

export const parseFromYaml = async (
  filePath: string,
): Promise<Result<ApiConfig, Error>> => {
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".yml" || ext === ".yaml") {
      const config = yaml.load(fileContent) as ApiConfig;
      return mergeConfig(config);
    } else if (ext === ".json") {
      const config = JSON.parse(fileContent) as ApiConfig;
      return mergeConfig(config);
    } else {
      return err(
        new Error(
          `Unsupported file extension: ${ext}. Only .yml, .yaml, and .json are supported.`,
        ),
      );
    }
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
