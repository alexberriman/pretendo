import morgan from "morgan";
import { Request, Response } from "express";
import { ApiOptions } from "../../types/index.js";

// Log entry type
export interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
}

// Extend the Express Request and Response interfaces for _startAt property
// Using module augmentation instead of namespace
declare module "express" {
  interface Request {
    _startAt?: [number, number];
    _startTime?: Date;
  }

  interface Response {
    _startAt?: [number, number];
    _startTime?: Date;
  }
}

// In-memory log storage
export class LogManager {
  private logs: LogEntry[] = [];
  public maxLogs: number;
  public enabled: boolean;

  constructor(options?: ApiOptions) {
    this.maxLogs = options?.logMaxEntries || 1000; // Default to storing 1000 entries
    this.enabled = options?.logRequests !== false;
  }

  // Add a new log entry
  addLog(entry: LogEntry): void {
    if (!this.enabled) return;

    // Add to the beginning for most recent first
    this.logs.unshift(entry);

    // Trim logs if exceeding max size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs with filtering options
  getFilteredLogs(options: {
    method?: string;
    status?: number;
    url?: string;
    limit?: number;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (options.method) {
      filtered = filtered.filter(
        (log) => log.method.toLowerCase() === options.method?.toLowerCase(),
      );
    }

    if (options.status) {
      filtered = filtered.filter((log) => log.status === options.status);
    }

    if (options.url) {
      filtered = filtered.filter((log) =>
        log.url.includes(options.url as string),
      );
    }

    if (options.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  // Clear all logs
  clearLogs(): void {
    this.logs = [];
  }
}

// Create a global log manager instance
export const logManager = new LogManager();

// Custom Morgan token for response time in ms
morgan.token("response-time-ms", (req: Request, res: Response) => {
  if (!res._startAt || !res._startTime) return "";

  const diff = process.hrtime(res._startAt);
  const time = diff[0] * 1e3 + diff[1] * 1e-6;
  return time.toFixed(2);
});

// Custom formatter to store logs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customLoggerFormat = (tokens: any, req: Request, res: Response) => {
  const method = tokens["method"](req, res) || "";
  const url = tokens["url"](req, res) || "";
  const status = parseInt(tokens["status"](req, res) || "0");
  const responseTime = parseFloat(tokens["response-time-ms"](req, res) || "0");

  // Create a unique ID for the log entry
  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

  // Create and store the log entry
  const logEntry: LogEntry = {
    id,
    timestamp: new Date().toISOString(),
    method,
    url,
    status,
    responseTime,
    userAgent: req.headers["user-agent"],
    ip: req.ip || req.socket.remoteAddress,
  };

  logManager.addLog(logEntry);

  // Return the formatted log string for console output
  return `${method} ${url} ${status} ${responseTime} ms`;
};

// Create middleware
export const createLoggerMiddleware = (options?: ApiOptions) => {
  // Update logger options if provided
  if (options) {
    logManager.maxLogs = options.logMaxEntries || 1000;
    logManager.enabled = options.logRequests !== false;
  }

  if (options?.logRequests === false) {
    return (req: Request, res: Response, next: () => void) => next();
  }

  return morgan(customLoggerFormat);
};
