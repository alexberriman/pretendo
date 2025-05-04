import { Request, Response, NextFunction } from "express";
import {
  ApiOptions,
  DatabaseService,
  ErrorResponse,
  RequestWithUser,
} from "../../types/index.js";
import crypto from "crypto";

// Define types for authentication
export type User = {
  username: string;
  password: string;
  role?: string;
  id?: string | number; // Include ID for ownership checks
};

export type AuthToken = {
  token: string;
  user: Omit<User, "password">;
  expiresAt: number;
};

// Authentication service
export class AuthService {
  private options: ApiOptions;
  private tokens: Map<string, AuthToken> = new Map();
  private readonly SECRET_KEY: string;

  constructor(options: ApiOptions) {
    this.options = options;
    this.SECRET_KEY =
      options.auth?.secretKey || "default-secret-key-for-development-only";
  }

  // Validate credentials and issue token
  async authenticateUser(
    username: string,
    password: string,
    database?: DatabaseService,
  ): Promise<AuthToken | null> {
    if (!this.options.auth?.enabled) {
      return null;
    }

    // Use legacy direct user definitions if no database or userResource is defined
    if (!database || !this.options.auth.userResource) {
      if (!this.options.auth.users) {
        return null;
      }

      const user = this.options.auth.users.find(
        (u: User) => u.username === username && u.password === password,
      );
      if (!user) {
        return null;
      }

      // Create token
      const tokenValue = this.generateToken();
      const expirationSeconds = this.options.auth.tokenExpiration || 3600; // Default 1 hour
      const expiresAt = Date.now() + expirationSeconds * 1000;

      // Build user object with proper typing
      const userObj: Omit<User, "password"> = {
        username: user.username,
        role: user.role,
      };

      // Add ID if available (using type assertion to satisfy TypeScript)
      if ("id" in user) {
        userObj.id = (user as { id: string | number }).id;
      }

      const authToken: AuthToken = {
        token: tokenValue,
        user: userObj,
        expiresAt,
      };

      // Store the token
      this.tokens.set(tokenValue, authToken);

      return authToken;
    }

    // Use specified user resource for authentication
    const userResourceName = this.options.auth.userResource;
    const usernameField = this.options.auth.usernameField || "username";
    const passwordField = this.options.auth.passwordField || "password";
    const roleField = this.options.auth.roleField || "role";

    // Get the user resource
    const userResourceResult = database.getResource(userResourceName);
    if (!userResourceResult.ok) {
      return null;
    }

    const userResource = userResourceResult.value;

    // Create query to find user by username
    const query: Record<string, string> = {};
    query[usernameField] = username;

    // Find the user
    const userResult = await userResource.findOne(query);
    if (!userResult.ok || !userResult.value) {
      return null;
    }

    const user = userResult.value;

    // Check password
    if (user[passwordField] !== password) {
      return null;
    }

    // Create token
    const tokenValue = this.generateToken();
    const expirationSeconds = this.options.auth.tokenExpiration || 3600; // Default 1 hour
    const expiresAt = Date.now() + expirationSeconds * 1000;

    // Build user object with proper typing
    const userObj: Omit<User, "password"> = {
      username: String(user[usernameField]),
      role: user[roleField] ? String(user[roleField]) : undefined,
    };

    // Add ID if available
    if ("id" in user) {
      userObj.id = user.id as string | number;
    }

    const authToken: AuthToken = {
      token: tokenValue,
      user: userObj,
      expiresAt,
    };

    // Store the token
    this.tokens.set(tokenValue, authToken);

    return authToken;
  }

  // Verify token is valid
  verifyToken(token: string): AuthToken | null {
    if (!token) {
      return null;
    }

    const authToken = this.tokens.get(token);
    if (!authToken) {
      return null;
    }

    // Check if token has expired
    if (authToken.expiresAt < Date.now()) {
      this.tokens.delete(token);
      return null;
    }

    return authToken;
  }

  // Revoke a token
  revokeToken(token: string): boolean {
    return this.tokens.delete(token);
  }

  // Private method to generate random token
  private generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}

// Middleware factory to create the authentication middleware
export const createAuthMiddleware = (
  authService: AuthService,
  options: ApiOptions,
) => {
  if (!options.auth?.enabled) {
    // Auth disabled, pass through
    return (req: Request, res: Response, next: NextFunction) => {
      next();
    };
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip auth for the login endpoint
    const loginPath = options.auth?.authEndpoint || "/auth/login";
    if (req.path === loginPath && req.method === "POST") {
      return next();
    }

    // Get token from Authorization header
    const tokenHeader = options.auth?.tokenHeader || "Authorization";
    const authHeader = req.headers[tokenHeader.toLowerCase()];

    if (!authHeader) {
      return res.status(401).json({
        status: 401,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      } as ErrorResponse);
    }

    let token = "";

    // Handle 'Bearer token' format
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = Array.isArray(authHeader) ? authHeader[0] : String(authHeader);
    }

    // Verify token
    const authToken = authService.verifyToken(token);
    if (!authToken) {
      return res.status(401).json({
        status: 401,
        message: "Invalid or expired token",
        code: "INVALID_TOKEN",
      } as ErrorResponse);
    }

    // Add user to request for authorization checks
    // This is used by the authorization middleware
    (req as RequestWithUser).user = authToken.user;

    next();
  };
};
