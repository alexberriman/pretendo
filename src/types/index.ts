// Export from "./api.js" - specify each to avoid name conflicts
export type {
  DatabaseService,
  Server,
  Store,
  RouteHandler,
  QueryFilter,
  QuerySort,
  QueryOptions,
  DbRecord,
  ResourceOperation,
  LogEntry,
  LogManager,
  HttpRequest,
  HttpResponse,
  NextFn,
  RequestHandler,
  RouteConfigurator,
  LifecycleHooks,
  ServerOptions,
} from "./api.js";

// Export from "./config.js" - specify each to avoid name conflicts
export type {
  ResourceField,
  Relationship,
  ResourceAccessControl,
  CustomRouteType,
  CustomRouteAccessControl,
  CustomRoute,
  Resource,
  AuthConfig,
  LatencyConfig,
  ErrorSimulationConfig,
  ExecuteJsContext,
  ExecuteJsResult,
  DatabaseAdapterType,
  DatabaseConfig,
  ApiOptions,
  ApiConfig,
} from "./config.js";

// Export everything from result and utils
export * from "./result.js";
export * from "./utils.js";

// Extended Request types for middleware/routes
export interface RequestWithUser {
  user?: {
    username: string;
    role?: string;
    id?: string | number; // User ID property for ownership checks
  };
  // RBAC middleware flags
  ownerCheckOnly?: boolean;
  strictOwnerCheck?: boolean;
  ownershipCheckRequired?: boolean;
}

export interface RequestWithResource {
  resource?: import("./config.js").Resource;
}

export interface RequestWithDatabase {
  db: import("./api.js").DatabaseService;
}

export interface RequestWithApiConfig {
  apiConfig: import("./config.js").ApiConfig;
}

// Make these partial to allow easier type casting
export type EnhancedRequest = Partial<RequestWithUser> &
  Partial<RequestWithResource> &
  Partial<RequestWithDatabase> &
  Partial<RequestWithApiConfig>;
