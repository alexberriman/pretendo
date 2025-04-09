import { ApiOptions } from "../types/index.js";

export const DEFAULT_OPTIONS: ApiOptions = {
  port: 3000,
  host: "localhost",
  corsEnabled: true,
  auth: {
    enabled: false,
    tokenExpiration: 3600, // 1 hour
    authEndpoint: "/auth/login",
    tokenHeader: "Authorization",
    users: [],
  },
  latency: {
    enabled: false,
    fixed: 0,
    min: 0,
    max: 0,
  },
  errorSimulation: {
    enabled: false,
    rate: 0,
    statusCodes: [500, 503, 504],
    queryParamTrigger: "errorCode",
  },
  dbPath: "./db.json",
  logRequests: true,
  allowPartialResponses: true,
  defaultPageSize: 10,
  maxPageSize: 100,
};
