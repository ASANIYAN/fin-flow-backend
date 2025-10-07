"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireEmailVerification = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const message_1 = require("../utils/message");
const auth_1 = require("../types/auth");
const client_1 = require("@prisma/client");
// Configuration validation - fail fast if JWT_SECRET is not defined
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}
// Enhanced middleware for JWT authentication with better error handling
const authenticateToken = (req, res, next) => {
    try {
        // Extract token from Authorization header
        const token = extractTokenFromHeader(req);
        if (!token) {
            return (0, message_1.errorResponse)(res, 401, "Access denied. No token provided.");
        }
        // Verify and decode the JWT token
        const decoded = verifyJWTToken(token);
        // Validate decoded payload structure
        if (!isValidJWTPayload(decoded)) {
            return (0, message_1.errorResponse)(res, 403, "Invalid token structure");
        }
        // Map JWT payload to user object and attach to request
        req.user = {
            id: decoded.userId,
            email: decoded.email || "", // Handle case where email might not be in JWT
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        handleAuthenticationError(res, error);
    }
};
exports.authenticateToken = authenticateToken;
// Helper function to extract token from Authorization header
const extractTokenFromHeader = (req) => {
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
const verifyJWTToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error(auth_1.AuthErrorType.TOKEN_EXPIRED);
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error(auth_1.AuthErrorType.INVALID_TOKEN);
        }
        throw new Error(auth_1.AuthErrorType.TOKEN_VERIFICATION_FAILED);
    }
};
// Helper function to validate JWT payload structure
const isValidJWTPayload = (payload) => {
    return (payload &&
        typeof payload === "object" &&
        typeof payload.userId === "string" &&
        typeof payload.role === "string" &&
        Object.values(client_1.Role).includes(payload.role));
};
// Enhanced error handler with specific error messages
const handleAuthenticationError = (res, error) => {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    switch (errorMessage) {
        case auth_1.AuthErrorType.TOKEN_EXPIRED:
            return (0, message_1.errorResponse)(res, 401, "Token has expired. Please login again.");
        case auth_1.AuthErrorType.INVALID_TOKEN:
            return (0, message_1.errorResponse)(res, 403, "Invalid token format.");
        case auth_1.AuthErrorType.TOKEN_VERIFICATION_FAILED:
            return (0, message_1.errorResponse)(res, 403, "Token verification failed.");
        default:
            // Authentication Error
            return (0, message_1.errorResponse)(res, 500, "Authentication service unavailable.");
    }
};
// Middleware to check if user's email is verified
const requireEmailVerification = async (req, res, next) => {
    const authenticatedReq = req;
    if (!authenticatedReq.user) {
        return (0, message_1.errorResponse)(res, 401, "Authentication required");
    }
    try {
        // Import here to avoid circular dependencies
        const { findUserById } = await Promise.resolve().then(() => __importStar(require("../services/userService")));
        // Fetch fresh user data from database to check email verification status
        const user = await findUserById(authenticatedReq.user.id);
        if (!user) {
            return (0, message_1.errorResponse)(res, 401, "User account not found. Please contact support.");
        }
        if (!user.isEmailVerified) {
            return (0, message_1.errorResponse)(res, 403, "Email verification required. Please check your email and verify your account before accessing this resource.", {
                requiresEmailVerification: true,
                userEmail: user.email,
            });
        }
        // Update the request user object with fresh verification status
        authenticatedReq.user = {
            ...authenticatedReq.user,
            email: user.email, // Ensure we have the latest email
        };
        next();
    }
    catch (error) {
        // Email verification check error
        return (0, message_1.errorResponse)(res, 500, "Unable to verify email status. Please try again later.");
    }
};
exports.requireEmailVerification = requireEmailVerification;
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        const authenticatedReq = req;
        if (!authenticatedReq.user) {
            return (0, message_1.errorResponse)(res, 401, "Authentication required");
        }
        if (!allowedRoles.includes(authenticatedReq.user.role)) {
            return (0, message_1.errorResponse)(res, 403, `Access denied. Required roles: ${allowedRoles.join(", ")}`);
        }
        next();
    };
};
exports.requireRole = requireRole;
