# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

- Build: `npm run build:clean`
- Lint: `npm run lint` or `npm run lint:all`
- Type Check: `npm run type-check`
- Tests: `npm run test`
- Single Test: `npm run test -- -t "test name pattern"`
- Watch Tests: `npm run test:watch`

## Code Style Guidelines

- Use TypeScript with strict type checking
- Follow functional programming principles, favor composition over inheritance
- Use pure functions when possible and minimize side effects
- Implement proper type definitions for excellent developer experience
- Name functions/variables clearly to indicate purpose
- Follow REST API design guidelines from https://github.com/alexberriman/rest-api-design
- Use camelCase for variables/properties, PascalCase for types/interfaces
- Use kebab-case for file names (e.g., my-component.ts instead of myComponent.ts)
- Prefix unused variables with underscore (\_)
- Write comprehensive tests for all functionality
- Organize code with clear module boundaries and responsibilities
- Handle errors explicitly and return meaningful error messages. Create a Result type to emulate Rust, and use the Result for all values and errors.
- Do not put inline comments in code. Quality code should be self documenting
- Don't use `any` in typescript
- Use advanced typescript features like generics, mapped types, conditional types, inference where appropriate
- Prefer functional programming over for..of and for loops
