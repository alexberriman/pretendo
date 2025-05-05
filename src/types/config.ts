export type ResourceField = {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array" | "date" | "uuid";
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
  enum?: unknown[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  unique?: boolean;
};

export type Relationship = {
  type: "belongsTo" | "hasOne" | "hasMany" | "manyToMany";
  resource: string;
  foreignKey: string;
  targetKey?: string;
  through?: string; // For many-to-many relationships, specifies the join table
};

export type ResourceAccessControl = {
  list?: string[];
  get?: string[];
  create?: string[];
  update?: string[];
  delete?: string[];
};

export type CustomRouteType = "json" | "javascript";

export type CustomRouteAccessControl = {
  enabled?: boolean; // Whether authentication is required for this route (override global setting)
  roles?: string[]; // Allowed roles for this route
};

export type CustomRoute = {
  path: string;
  method: "get" | "post" | "put" | "patch" | "delete";
  type: CustomRouteType;
  response?: unknown; // For type: "json"
  code?: string; // For type: "javascript"
  description?: string;
  auth?: CustomRouteAccessControl; // Route-level authentication configuration
};

export type Resource = {
  name: string;
  primaryKey?: string;
  fields: ResourceField[];
  relationships?: Relationship[];
  initialData?: Record<string, unknown>[];
  access?: ResourceAccessControl;
  ownedBy?: string; // Field that links to the owning user
};

export type AuthConfig = {
  enabled: boolean;
  tokenExpiration?: number; // Time in seconds
  authEndpoint?: string; // Default is /auth/login
  secretKey?: string; // For signing JWT tokens
  tokenHeader?: string; // Default is Authorization
  // User resource configuration (required when auth is enabled)
  userResource?: string; // Name of the resource to use for users
  usernameField?: string; // Field to use as username (default: 'username')
  passwordField?: string; // Field to use as password (default: 'password')
  emailField?: string; // Field to use as email (default: 'email')
  roleField?: string; // Field to use as role (default: 'role')
  // Legacy direct user definitions (deprecated)
  users?: Array<{
    username: string;
    password: string;
    role?: string;
  }>;
};

export type LatencyConfig = {
  enabled: boolean;
  fixed?: number; // Fixed delay in ms
  min?: number; // Minimum delay in ms for random delay
  max?: number; // Maximum delay in ms for random delay
};

export type ErrorSimulationConfig = {
  enabled: boolean;
  rate?: number; // Probability of error (0-1)
  statusCodes?: number[]; // Possible error status codes to return
  queryParamTrigger?: string; // Query param to trigger errors (e.g., ?errorCode=500)
};

/**
 * Context for JavaScript code execution
 */
export type ExecuteJsContext = {
  /** The JavaScript code to execute */
  code: string;

  /** Request information */
  request: {
    params: Record<string, string | string[]>;
    query: Record<string, string | string[]>;
    body: unknown;
    headers: Record<string, string | string[] | undefined>;
    method: string;
    path: string;
    user?: {
      id: string | number;
      username: string;
      role?: string;
    };
  };

  /** Database operations interface */
  db: {
    getResourceById: (
      resourceName: string,
      id: string | number,
    ) => Promise<unknown>;
    getResources: (
      resourceName: string,
      options?: Record<string, unknown>,
    ) => Promise<unknown[] | null>;
    createResource: (
      resourceName: string,
      data: Record<string, unknown>,
    ) => Promise<unknown>;
    updateResource: (
      resourceName: string,
      id: string | number,
      data: Record<string, unknown>,
    ) => Promise<unknown>;
    deleteResource: (
      resourceName: string,
      id: string | number,
    ) => Promise<boolean | null>;
    getRelatedResources: (
      resourceName: string,
      id: string | number,
      relationship: string,
      options?: Record<string, unknown>,
    ) => Promise<unknown[] | null>;
  };

  /** Logging function */
  log: (message: string, ...args: unknown[]) => void;
};

/**
 * Result of JavaScript code execution
 */
export type ExecuteJsResult = {
  /** HTTP status code to return */
  status: number;

  /** HTTP headers to include in the response */
  headers: Record<string, string>;

  /** Response body (will be converted to JSON) */
  body: unknown;
};

export type DatabaseAdapterType = "json-file" | "memory" | string;

export type DatabaseConfig = {
  /**
   * Type of database adapter to use.
   * Built-in options: "json-file" (default), "memory"
   * Can also be a custom adapter instance.
   */
  adapter?: DatabaseAdapterType | object;

  /**
   * Path to the database file (for json-file adapter)
   */
  dbPath?: string;

  /**
   * Whether to automatically save changes to disk (for json-file adapter)
   */
  autoSave?: boolean;

  /**
   * Interval between auto-saves in milliseconds (for json-file adapter)
   * Default is 5000ms (5 seconds)
   */
  saveInterval?: number;

  /**
   * Whether to enable strict validation for resource fields
   */
  strictValidation?: boolean;

  /**
   * Custom adapter-specific options
   */
  [key: string]: unknown;
};

export type ApiOptions = {
  port?: number; // Default 3000
  host?: string; // Default localhost
  corsEnabled?: boolean;
  auth?: AuthConfig;
  latency?: LatencyConfig;
  errorSimulation?: ErrorSimulationConfig;
  dbPath?: string; // Legacy path to JSON storage file (deprecated, use database.dbPath instead)
  logRequests?: boolean;
  logMaxEntries?: number; // Maximum number of log entries to keep in memory (default: 1000)
  allowPartialResponses?: boolean; // For fields param support
  defaultPageSize?: number; // Default page size for pagination
  maxPageSize?: number; // Maximum allowed page size
  strictValidation?: boolean; // Whether to enable strict validation for resource fields

  /**
   * Database configuration options
   */
  database?: DatabaseConfig;

  /**
   * OpenAPI documentation configuration
   */
  docs?: {
    /**
     * Whether the OpenAPI documentation endpoint is enabled
     * Default: true in development, false in production
     */
    enabled?: boolean;

    /**
     * Whether to require authentication for the documentation endpoint
     * Default: false in development, true in production
     */
    requireAuth?: boolean;
  };

  /**
   * OpenAPI documentation configuration
   */
  docs?: {
    /**
     * Whether the OpenAPI documentation endpoint is enabled
     * Default: true in development, false in production
     */
    enabled?: boolean;

    /**
     * Whether to require authentication for the documentation endpoint
     * Default: false in development, true in production
     */
    requireAuth?: boolean;
  };

  /**
   * Optional hook to override JavaScript execution for custom routes.
   * If provided, Pretendo will use this function instead of its internal JavaScript execution engine.
   * This is useful for executing untrusted code in a secure, isolated environment.
   *
   * @param context The execution context including code and request information
   * @returns A promise that resolves to the execution result
   */
  executeJs?: (context: ExecuteJsContext) => Promise<ExecuteJsResult>;
};

export type ApiConfig = {
  resources: Resource[];
  options?: ApiOptions;
  data?: Record<string, Record<string, unknown>[]>; // Initial data for resources
  routes?: CustomRoute[]; // Custom routes at the API level
};
