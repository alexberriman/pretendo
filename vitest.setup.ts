import { afterEach, beforeEach, vi } from "vitest";

// Set environment variable to indicate test mode
// This ensures special test routes are only active during tests
process.env.PRETENDO_TEST = "true";

// Make common testing functions available globally
globalThis.beforeEach = beforeEach;
globalThis.afterEach = afterEach;
globalThis.vi = vi;
