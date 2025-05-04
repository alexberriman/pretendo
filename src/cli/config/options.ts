import { ApiConfig } from "../../types/index.js";

/**
 * Apply command line options to the API configuration
 */
export const applyCliOptions = (
  config: ApiConfig,
  options: Record<string, unknown>,
): void => {
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
};
