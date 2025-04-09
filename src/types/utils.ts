// Helper type to make all properties of T, and properties of properties, etc. readonly
export type ReadonlyDeep<T> = T extends (infer R)[]
  ? ReadonlyArray<ReadonlyDeep<R>>
  : T extends (...args: unknown[]) => unknown
    ? T
    : T extends object
      ? { readonly [K in keyof T]: ReadonlyDeep<T[K]> }
      : T;

// Type for HTTP Methods
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS";

// Type for request query parameters
export type QueryParams = Record<string, string | string[] | undefined>;

// Type for response headers
export type Headers = Record<string, string | string[] | number>;

// Pagination links following RFC 5988
export type PaginationLinks = {
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
};

// Paginated response metadata
export type PaginationMeta = {
  currentPage: number;
  perPage: number;
  totalPages: number;
  totalItems: number;
  links: PaginationLinks;
};

// Standard error response
export type ErrorResponse = {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
};
