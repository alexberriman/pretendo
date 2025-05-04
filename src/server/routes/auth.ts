import { Request, Response } from "express";
import {
  ApiOptions,
  DatabaseService,
  ErrorResponse,
} from "../../types/index.js";
import { AuthService } from "../middleware/auth.js";

// Handler for POST /auth/login
export const loginHandler = (
  authService: AuthService,
  options: ApiOptions,
  database: DatabaseService,
) => {
  return async (req: Request, res: Response) => {
    // Check if auth is enabled
    if (!options.auth?.enabled) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: "Authentication is not enabled",
        code: "AUTH_DISABLED",
      };
      return res.status(404).json(errorResponse);
    }

    // Get credentials from request body
    const { username, password } = req.body;

    if (!username || !password) {
      const errorResponse: ErrorResponse = {
        status: 400,
        message: "Username and password are required",
        code: "INVALID_CREDENTIALS",
      };
      return res.status(400).json(errorResponse);
    }

    // Authenticate user
    const authToken = await authService.authenticateUser(
      username,
      password,
      database,
    );

    if (!authToken) {
      const errorResponse: ErrorResponse = {
        status: 401,
        message: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      };
      return res.status(401).json(errorResponse);
    }

    // Return token and user info
    res.json({
      token: authToken.token,
      user: authToken.user,
      expiresAt: authToken.expiresAt,
    });
  };
};

// Handler for POST /auth/logout
export const logoutHandler = (
  authService: AuthService,
  options: ApiOptions,
) => {
  return async (req: Request, res: Response) => {
    // Check if auth is enabled
    if (!options.auth?.enabled) {
      const errorResponse: ErrorResponse = {
        status: 404,
        message: "Authentication is not enabled",
        code: "AUTH_DISABLED",
      };
      return res.status(404).json(errorResponse);
    }

    // Get token from request
    const tokenHeader = options.auth?.tokenHeader || "Authorization";
    const authHeader = req.headers[tokenHeader.toLowerCase()];

    if (!authHeader) {
      // No token provided, just return success
      return res.status(204).end();
    }

    let token = "";

    // Handle 'Bearer token' format
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = Array.isArray(authHeader) ? authHeader[0] : String(authHeader);
    }

    // Revoke token
    authService.revokeToken(token);

    // Return success
    res.status(204).end();
  };
};
