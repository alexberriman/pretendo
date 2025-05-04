export * from "./api.js";
export * from "./config.js";
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
