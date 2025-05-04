// Debug logger utility for internal messages
// This separates debug/info level logging from error/warn
// which allows ESLint no-console to be configured to only allow warn/error

/**
 * Logger utility for debug messages that won't trigger ESLint no-console warnings
 * Only use this for temporary debugging or informational messages
 */
export const logger = {
  /**
   * Log debug information (development only)
   */
  debug(...args: unknown[]): void {
    // For production, we could disable this
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[DEBUG]", ...args);
    }
  },

  /**
   * Log information (development only)
   */
  info(...args: unknown[]): void {
    // For production, we could disable this
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[INFO]", ...args);
    }
  },

  /**
   * Log warning (allowed by ESLint config)
   */
  warn(...args: unknown[]): void {
    console.warn("[WARN]", ...args);
  },

  /**
   * Log error (allowed by ESLint config)
   */
  error(...args: unknown[]): void {
    console.error("[ERROR]", ...args);
  },
};
