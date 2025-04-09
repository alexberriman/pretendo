import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";

const commonParserOptions = {
  ecmaVersion: 2020,
  sourceType: "module",
};

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "docs/**",
      "*.json",
      "eslint.config.js",
      "scripts/**",
      "*.md",
      "*.prettierrc",
      ".npmignore",
      ".gitignore",
      "vitest.config.ts",
      "test-type.ts",
      "vitest.integration.config.ts",
      "vitest.setup.ts",
      "tests/**/*.ts",
    ],
  },
  {
    files: ["src/**/*.ts", "!src/**/*.test.ts", "!src/cli/**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ...commonParserOptions,
        project: ["./tsconfig.json", "./tsconfig.test.json"],
        tsconfigRootDir: ".",
      },
      globals: {},
    },
    plugins: {
      "@typescript-eslint": typescript,
      prettier: prettier,
      import: importPlugin,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...prettier.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "import/extensions": "off",
    },
  },
  {
    files: ["src/cli/**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ...commonParserOptions,
        project: ["./tsconfig.json", "./tsconfig.test.json"],
        tsconfigRootDir: ".",
      },
      globals: {},
    },
    plugins: {
      "@typescript-eslint": typescript,
      prettier: prettier,
      import: importPlugin,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...prettier.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": "off", // Allow console.log in CLI directory
      "import/extensions": "off",
    },
  },
  {
    files: ["src/**/*.test.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ...commonParserOptions,
        project: ["./tsconfig.json", "./tsconfig.test.json"],
        tsconfigRootDir: ".",
      },
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        vi: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      prettier: prettier,
      import: importPlugin,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...prettier.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "import/extensions": "off",
    },
  },
  prettierConfig,
];
