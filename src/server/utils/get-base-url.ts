import { Request } from "express";

/**
 * Extracts the base URL from a request object
 */
export const getBaseUrl = (req: Request): string => {
  const host = req.headers.host || "localhost";
  return `${req.protocol}://${host}${req.baseUrl}${req.path}`;
};
