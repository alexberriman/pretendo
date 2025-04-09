import { ApiConfig } from "../../types/index.js";
import Table from "cli-table3";
import { theme, formatSection } from "../ui/theme.js";

export const handleConfig = async (config: ApiConfig): Promise<void> => {
  console.log(formatSection("API Configuration"));
  
  const table = new Table({
    head: [
      theme.heading("Option"),
      theme.heading("Value"),
    ],
    style: {
      head: [],
      border: [],
    },
    colWidths: [20, 50],
  });
  
  // Extract and format configuration options
  const {
    port = 3000,
    host = "localhost",
    corsEnabled = true,
    dbPath = "./db.json",
    defaultPageSize = 10,
    maxPageSize = 100,
    latency,
    errorSimulation,
    auth,
    ...otherOptions
  } = config.options || {};
  
  table.push(
    ["Port", theme.accent(port.toString())],
    ["Host", theme.text(host)],
    ["CORS Enabled", corsEnabled ? theme.success("Yes") : theme.error("No")],
    ["Database Path", theme.text(dbPath)],
    ["Default Page Size", theme.accent(defaultPageSize.toString())],
    ["Max Page Size", theme.accent(maxPageSize.toString())]
  );
  
  // Add latency configuration if enabled
  if (latency?.enabled) {
    const latencyDesc = latency.fixed 
      ? `Fixed delay: ${latency.fixed}ms` 
      : `Random delay: ${latency.min || 0}-${latency.max || 1000}ms`;
    table.push(["Latency", theme.text(latencyDesc)]);
  }
  
  // Add error simulation if enabled
  if (errorSimulation?.enabled) {
    table.push([
      "Error Simulation", 
      theme.text(`Rate: ${(errorSimulation.rate || 0) * 100}%`)
    ]);
  }
  
  // Add authentication if enabled
  if (auth?.enabled) {
    table.push([
      "Authentication", 
      theme.success("Enabled")
    ]);
    
    if (auth.authEndpoint) {
      table.push([
        "Auth Endpoint", 
        theme.text(auth.authEndpoint)
      ]);
    }
    
    if (auth.tokenExpiration) {
      table.push([
        "Token Expiration", 
        theme.text(`${auth.tokenExpiration} seconds`)
      ]);
    }
  }
  
  // Add any other options
  Object.entries(otherOptions).forEach(([key, value]) => {
    if (typeof value === "object") {
      table.push([
        key, 
        theme.dimText(JSON.stringify(value))
      ]);
    } else {
      table.push([
        key, 
        theme.text(String(value))
      ]);
    }
  });
  
  console.log(table.toString());
};