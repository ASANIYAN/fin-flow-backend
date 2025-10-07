// Authentication-related types and interfaces

import { Role } from "../../node_modules/.prisma/client";
import { Request } from "express";

// JWT payload interface for better type safety
export interface JWTPayload {
  userId: string;
  role: Role;
  email?: string; // Email might not always be in JWT payload
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

// Enhanced request interface with authenticated user
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
    isEmailVerified?: boolean; // Added for email verification checks
  };
}

// Extended request interface for verified users
export interface VerifiedUserRequest extends AuthenticatedRequest {
  user: AuthenticatedRequest["user"] & {
    isEmailVerified: true; // Guaranteed to be verified
  };
}

// Authentication configuration
export interface AuthConfig {
  jwtSecret: string;
  tokenExpiry?: string;
  issuer?: string;
  audience?: string;
}

// Error types for better error handling
export enum AuthErrorType {
  TOKEN_MISSING = "TOKEN_MISSING",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_VERIFICATION_FAILED = "TOKEN_VERIFICATION_FAILED",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
}

// User context interface for middleware
export interface UserContext {
  id: string;
  email: string;
  role: Role;
  isEmailVerified?: boolean;
  permissions?: string[];
}
