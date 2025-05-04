#!/usr/bin/env node
import { initializeProgram } from "./services/program.js";

// Initialize and run the CLI program
const program = initializeProgram();
program.parse(process.argv);
