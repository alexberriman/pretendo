import { afterEach, beforeEach, afterAll, vi } from "vitest";
import fs from "fs/promises";
import path from "path";

// Set environment variable to indicate test mode
// This ensures special test routes are only active during tests
process.env.PRETENDO_TEST = "true";

// Make common testing functions available globally
globalThis.beforeEach = beforeEach;
globalThis.afterEach = afterEach;
globalThis.vi = vi;

// Clean up test database files after all tests
afterAll(async () => {
  try {
    // Get the current working directory
    const cwd = process.cwd();
    const files = await fs.readdir(cwd);
    
    // Find and delete all test database files
    const testDbPatterns = [
      /^\.tmp-.*\.json$/,       // .tmp-***.json files
      /^test-db\.json$/,        // test-db.json file
      /^.*\.test\.db\.json$/,   // any file ending with .test.db.json
    ];
    
    for (const file of files) {
      const isTestDb = testDbPatterns.some(pattern => pattern.test(file));
      if (isTestDb) {
        try {
          await fs.unlink(path.join(cwd, file));
          console.log(`Deleted test database file: ${file}`);
        } catch (error) {
          console.error(`Failed to delete ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error cleaning up test database files:", error);
  }
});
