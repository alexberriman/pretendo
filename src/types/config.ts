export type ResourceField = {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array" | "date";
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
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

export type CustomRoute = {
  path: string;
  method: "get" | "post" | "put" | "patch" | "delete";
  type: CustomRouteType;
  response?: unknown; // For type: "json"
  code?: string; // For type: "javascript"
  description?: string;
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

export type ApiOptions = {
  port?: number; // Default 3000
  host?: string; // Default localhost
  corsEnabled?: boolean;
  auth?: AuthConfig;
  latency?: LatencyConfig;
  errorSimulation?: ErrorSimulationConfig;
  dbPath?: string; // Path to JSON storage file
  logRequests?: boolean;
  logMaxEntries?: number; // Maximum number of log entries to keep in memory (default: 1000)
  allowPartialResponses?: boolean; // For fields param support
  defaultPageSize?: number; // Default page size for pagination
  maxPageSize?: number; // Maximum allowed page size
};

export type ApiConfig = {
  resources: Resource[];
  options?: ApiOptions;
  data?: Record<string, Record<string, unknown>[]>; // Initial data for resources
  routes?: CustomRoute[]; // Custom routes at the API level
};
