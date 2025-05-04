/**
 * Type definitions for the context object passed to JavaScript custom routes
 */
import { QueryFilter } from "../../../types/api.js";

/**
 * Database query options for JavaScript routes
 * This is compatible with the QueryOptions interface from API
 */
export interface DatabaseQueryOptions {
  page?: number;
  perPage?: number;
  sort?: Array<{ field: string; order: "asc" | "desc" }>;
  filters?: QueryFilter[];
  expand?: string[];
  fields?: string[];
}

/**
 * The request object available to custom JavaScript routes
 */
export interface RouteRequest {
  /** URL parameters from path parameters like /:id */
  params: Record<string, string | string[]>;

  /** Query parameters from URL like ?foo=bar */
  query: Record<string, string | string[]>;

  /** Request body from JSON or form data */
  body: unknown;

  /** HTTP headers from the request */
  headers: Record<string, string | string[] | undefined>;

  /** HTTP method (GET, POST, etc.) */
  method: string;

  /** Request path */
  path: string;

  /** Authenticated user (if available) */
  user?: {
    id: string | number;
    username: string;
    role?: string;
  };
}

/**
 * The response object that can be modified by custom JavaScript routes
 */
export interface RouteResponse {
  /** HTTP status code to return (default: 200) */
  status: number;

  /** HTTP headers to include in the response */
  headers: Record<string, string>;

  /** Response body (will be converted to JSON) */
  body: unknown;
}

/**
 * Console-like logging interface available in JavaScript routes
 */
export interface RouteConsole {
  /** Log informational message */
  log: (...args: unknown[]) => void;

  /** Log error message */
  error: (...args: unknown[]) => void;

  /** Log warning message */
  warn: (...args: unknown[]) => void;

  /** Log info message */
  info: (...args: unknown[]) => void;
}

/**
 * Database operations available to JavaScript routes
 */
export interface RouteDatabase {
  /**
   * Get a resource by ID
   *
   * @param resourceName The name of the resource (e.g., "users")
   * @param id The ID of the resource
   * @returns The resource or null if not found
   */
  getResourceById: (
    resourceName: string,
    id: string | number,
  ) => Promise<unknown>;

  /**
   * Query resources with optional filtering, sorting, and pagination
   *
   * @param resourceName The name of the resource (e.g., "users")
   * @param options Query options (filters, sorting, pagination)
   * @returns Array of matching resources
   */
  getResources: (
    resourceName: string,
    options?: DatabaseQueryOptions,
  ) => Promise<unknown[] | null>;

  /**
   * Create a new resource
   *
   * @param resourceName The name of the resource (e.g., "users")
   * @param data The resource data
   * @returns The created resource with ID
   */
  createResource: (
    resourceName: string,
    data: Record<string, unknown>,
  ) => Promise<unknown>;

  /**
   * Update a resource (replace)
   *
   * @param resourceName The name of the resource (e.g., "users")
   * @param id The ID of the resource to update
   * @param data The new resource data
   * @returns The updated resource or null if not found
   */
  updateResource: (
    resourceName: string,
    id: string | number,
    data: Record<string, unknown>,
  ) => Promise<unknown>;

  /**
   * Delete a resource
   *
   * @param resourceName The name of the resource (e.g., "users")
   * @param id The ID of the resource to delete
   * @returns true if deleted, false if not found
   */
  deleteResource: (
    resourceName: string,
    id: string | number,
  ) => Promise<boolean | null>;

  /**
   * Get related resources
   *
   * @param resourceName The name of the resource (e.g., "users")
   * @param id The ID of the resource
   * @param relationship The name of the relationship (e.g., "posts")
   * @param options Query options (filters, sorting, pagination)
   * @returns Array of related resources
   */
  getRelatedResources: (
    resourceName: string,
    id: string | number,
    relationship: string,
    options?: DatabaseQueryOptions,
  ) => Promise<unknown[] | null>;
}

/**
 * Full context object available to JavaScript routes
 */
export interface JavaScriptRouteContext {
  /** Request information */
  request: RouteRequest;

  /** Response object that can be modified */
  response: RouteResponse;

  /** Console for logging */
  console: RouteConsole;

  /** Database operations */
  db: RouteDatabase;
}
