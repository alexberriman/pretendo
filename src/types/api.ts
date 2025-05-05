import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { ApiConfig } from "./config.js";
import { Result } from "./result.js";
import { ReadonlyDeep } from "./utils.js";

export type QueryFilter = {
  field: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin"
    | "contains"
    | "startsWith"
    | "endsWith";
  value: unknown;
  caseSensitive?: boolean;
};

export type QuerySort = {
  field: string;
  order: "asc" | "desc";
};

export type QueryOptions = {
  page?: number;
  perPage?: number;
  sort?: QuerySort[];
  filters?: QueryFilter[];
  expand?: string[];
  fields?: string[];
};

export type DbRecord = Record<string, unknown>;

export type ResourceOperation<T = DbRecord> = {
  findAll: (options?: QueryOptions) => Promise<Result<T[], Error>>;
  findById: (id: string | number) => Promise<Result<T | null, Error>>;
  findOne: (query: Record<string, unknown>) => Promise<Result<T | null, Error>>;
  create: (data: Omit<T, "id">) => Promise<Result<T, Error>>;
  update: (
    id: string | number,
    data: Partial<T>,
  ) => Promise<Result<T | null, Error>>;
  patch: (
    id: string | number,
    data: Partial<T>,
  ) => Promise<Result<T | null, Error>>;
  delete: (id: string | number) => Promise<Result<boolean, Error>>;
  findRelated: (
    id: string | number,
    relationship: string,
    options?: QueryOptions,
  ) => Promise<Result<T[], Error>>;
};

export type DatabaseService = {
  initialize: (config: ReadonlyDeep<ApiConfig>) => Promise<Result<void, Error>>;
  getResource: (resourceName: string) => Result<ResourceOperation, Error>;
  getResourceConfig: (
    resourceName: string,
  ) => Result<import("./config.js").Resource, Error>;
  reset: () => Promise<Result<void, Error>>;
  backup: (path?: string) => Promise<Result<string, Error>>;
  restore: (path: string) => Promise<Result<Record<string, DbRecord[]>, Error>>;
  getStats?: () => Record<string, { count: number; lastModified: number }>;
};

export type RouteHandler = (
  req: ExpressRequest,
  res: ExpressResponse,
) => Promise<void>;

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

export interface LogManager {
  getLogs: () => LogEntry[];
  getFilteredLogs: (options: {
    method?: string;
    status?: number;
    url?: string;
    limit?: number;
  }) => LogEntry[];
  clearLogs: () => void;
}

export interface HttpRequest {
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
  [key: string]: unknown;
}

export interface HttpResponse {
  status: (code: number) => HttpResponse;
  json: (body: unknown) => void;
  send: (body: string) => void;
  setHeader: (name: string, value: string) => void;
  headersSent: boolean;
  [key: string]: unknown;
}

export type NextFn = (error?: unknown) => void;

export type RequestHandler = (
  req: HttpRequest,
  res: HttpResponse,
  next: NextFn,
) => void | Promise<void>;

export type RouteConfigurator = (router: unknown) => void;

export type LifecycleHooks = {
  onRequest?: RequestHandler | RequestHandler[];
  onResponse?: RequestHandler | RequestHandler[];
  onError?: RequestHandler | RequestHandler[];
  beforeRoute?: RequestHandler | RequestHandler[];
  afterRoute?: RequestHandler | RequestHandler[];
  [key: string]: RequestHandler | RequestHandler[] | undefined;
};

export interface ExecuteJsContext {
  code: string;
  request: HttpRequest;
  db: DatabaseService;
  log: (message: string, ...args: unknown[]) => void;
}

export interface ExecuteJsResult {
  status?: number;
  headers?: Record<string, string>;
  body: unknown;
}

export type ServerOptions = {
  adapterType?: string;
  routes?: RouteConfigurator;
  hooks?: LifecycleHooks;
  executeJs?: (context: ExecuteJsContext) => Promise<ExecuteJsResult>;
};

export type Server = {
  start: (port?: number, host?: string) => Promise<Result<void, Error>>;
  stop: () => Promise<Result<void, Error>>;
  getUrl: () => string;
  logs: LogManager;
  /**
   * Access to the server adapter for advanced operations
   */
  getAdapter?: () => unknown;
};

export interface Store {
  getData: (
    collection?: string,
  ) => Record<string, DbRecord[]> | Result<DbRecord[], Error>;
  getCollection: (name: string) => Result<DbRecord[], Error>;
  getRecord: (
    collection: string,
    id: string | number,
    primaryKey?: string,
  ) => Result<DbRecord | null, Error>;
  setRecord: (
    collection: string,
    record: DbRecord,
    primaryKey?: string,
  ) => Result<DbRecord, Error>;
  addRecord: (
    collection: string,
    record: DbRecord,
    primaryKey?: string,
    fields?: import("./config.js").ResourceField[],
  ) => Result<DbRecord, Error>;
  updateRecord: (
    collection: string,
    id: string | number,
    updateData: Partial<DbRecord>,
    primaryKey?: string,
    merge?: boolean,
    fields?: import("./config.js").ResourceField[],
  ) => Result<DbRecord | null, Error>;
  deleteRecord: (
    collection: string,
    id: string | number,
    primaryKey?: string,
    cascadeRelationships?: Array<{ collection: string; foreignKey: string }>,
  ) => Result<boolean, Error>;
  findRelated: (
    collection: string,
    id: string | number,
    relatedCollection: string,
    foreignKey: string,
    queryOptions?: QueryOptions,
    primaryKey?: string,
  ) => Result<DbRecord[], Error>;
  query: (
    collection: string,
    options?: QueryOptions,
  ) => Result<DbRecord[], Error>;
  reset: (newData: Record<string, DbRecord[]>) => Result<void, Error>;
}
