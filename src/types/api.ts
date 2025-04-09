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
  reset: () => Promise<Result<void, Error>>;
  backup: (path?: string) => Promise<Result<string, Error>>;
  restore: (path: string) => Promise<Result<void, Error>>;
  getStats?: () => Record<string, { count: number; lastModified: number }>;
};

export type RouteHandler = (
  req: ExpressRequest,
  res: ExpressResponse,
) => Promise<void>;

export type Server = {
  start: (port?: number) => Promise<Result<void, Error>>;
  stop: () => Promise<Result<void, Error>>;
  getUrl: () => string;
};
