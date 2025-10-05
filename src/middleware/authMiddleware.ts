import jwt from "jsonwebtoken";
import { Role } from "../lib/prisma";
import { errorResponse } from "../utils/message";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest, JWTPayload, AuthErrorType } from "../types/auth";

// Configuration validation - fail fast if JWT_SECRET is not defined
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Enhanced middleware for JWT authentication with better error handling
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req);

    if (!token) {
      return errorResponse(res, 401, "Access denied. No token provided.");
    }

    // Verify and decode the JWT token
    const decoded = verifyJWTToken(token);

    // Validate decoded payload structure
    if (!isValidJWTPayload(decoded)) {
      return errorResponse(res, 403, "Invalid token structure");
    }

    // Map JWT payload to user object and attach to request
    (req as AuthenticatedRequest).user = {
      id: decoded.userId,
      email: decoded.email || "", // Handle case where email might not be in JWT
      role: decoded.role,
    };

    next();
  } catch (error) {
    handleAuthenticationError(res, error);
  }
};

// Helper function to extract token from Authorization header
const extractTokenFromHeader = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer token" and "token" formats
  const parts = authHeader.split(" ");

  if (parts.length === 2 && parts[0] === "Bearer") {
    return parts[1];
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return null;
};

// Helper function to verify JWT token with proper error handling
const verifyJWTToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error(AuthErrorType.TOKEN_EXPIRED);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(AuthErrorType.INVALID_TOKEN);
    }
    throw new Error(AuthErrorType.TOKEN_VERIFICATION_FAILED);
  }
};

// Helper function to validate JWT payload structure
const isValidJWTPayload = (payload: any): payload is JWTPayload => {
  return (
    payload &&
    typeof payload === "object" &&
    typeof payload.userId === "string" &&
    typeof payload.role === "string" &&
    Object.values(Role).includes(payload.role)
  );
};

// Enhanced error handler with specific error messages
const handleAuthenticationError = (res: Response, error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  switch (errorMessage) {
    case AuthErrorType.TOKEN_EXPIRED:
      return errorResponse(res, 401, "Token has expired. Please login again.");

    case AuthErrorType.INVALID_TOKEN:
      return errorResponse(res, 403, "Invalid token format.");

    case AuthErrorType.TOKEN_VERIFICATION_FAILED:
      return errorResponse(res, 403, "Token verification failed.");

    default:
      // Authentication Error
      return errorResponse(res, 500, "Authentication service unavailable.");
  }
};

// Middleware to check if user's email is verified
export const requireEmailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authenticatedReq = req as AuthenticatedRequest;

  if (!authenticatedReq.user) {
    return errorResponse(res, 401, "Authentication required");
  }

  try {
    // Import here to avoid circular dependencies
    const { findUserById } = await import("../services/userService");

    // Fetch fresh user data from database to check email verification status
    const user = await findUserById(authenticatedReq.user.id);

    if (!user) {
      return errorResponse(
        res,
        401,
        "User account not found. Please contact support."
      );
    }

    if (!user.isEmailVerified) {
      return errorResponse(
        res,
        403,
        "Email verification required. Please check your email and verify your account before accessing this resource.",
        {
          requiresEmailVerification: true,
          userEmail: user.email,
        }
      );
    }

    // Update the request user object with fresh verification status
    authenticatedReq.user = {
      ...authenticatedReq.user,
      email: user.email, // Ensure we have the latest email
    };

    next();
  } catch (error) {
    // Email verification check error
    return errorResponse(
      res,
      500,
      "Unable to verify email status. Please try again later."
    );
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user) {
      return errorResponse(res, 401, "Authentication required");
    }

    if (!allowedRoles.includes(authenticatedReq.user.role)) {
      return errorResponse(
        res,
        403,
        `Access denied. Required roles: ${allowedRoles.join(", ")}`
      );
    }

    next();
  };
};
