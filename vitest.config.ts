import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"
    ],
    exclude: ["**/node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["**/node_modules/**"],
    },
    mockReset: true,
    restoreMocks: true,
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 10000, // Increase timeout for integration tests
  },
});
