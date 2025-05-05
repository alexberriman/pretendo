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
  restore: (path: string) => Promise<Result<void, Error>>;
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

export type Server = {
  start: (port?: number) => Promise<Result<void, Error>>;
  stop: () => Promise<Result<void, Error>>;
  getUrl: () => string;
  logs: LogManager;
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
