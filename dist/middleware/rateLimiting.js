"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomRateLimit = exports.emailVerificationRateLimit = exports.passwordResetRateLimit = exports.speedLimiter = exports.apiRateLimit = exports.financialRateLimit = exports.authRateLimit = exports.globalRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
// Helper function to safely extract IP address with IPv6 support
const getClientIP = (req) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        const ips = forwardedFor.split(',');
        return ips[0].trim();
    }
    return req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip ||
        'unknown';
};
// Custom key generator that considers user authentication status
const createKeyGenerator = (prefix) => {
    return (req) => {
        // For authenticated requests, use user ID
        const user = req.user;
        if (user?.id) {
            return `${prefix}:user:${user.id}`;
        }
        // For unauthenticated requests, use IP address with proper IPv6 handling
        const clientIp = getClientIP(req);
        return `${prefix}:ip:${clientIp}`;
    };
};
// Custom error handler for rate limit exceeded
const rateLimitHandler = (req, res) => {
    const isAuthenticated = !!req.user?.id;
    res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            type: 'RateLimitError',
            retryAfter: Math.round((req.rateLimit?.msBeforeNext || 60000) / 1000),
            limit: req.rateLimit?.limit,
            remaining: req.rateLimit?.remaining,
            resetTime: new Date(Date.now() + (req.rateLimit?.msBeforeNext || 60000)),
            userType: isAuthenticated ? 'authenticated' : 'anonymous',
            suggestion: isAuthenticated
                ? 'You have exceeded the rate limit for authenticated users. Please wait before making more requests.'
                : 'You have exceeded the rate limit. Consider creating an account for higher limits.'
        }
    });
};
/**
 * TIER 1: Global Rate Limiting
 * Applied to all endpoints to prevent basic DoS attacks
 * More lenient limits to allow normal usage
 */
exports.globalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
        // Higher limits for authenticated users
        const user = req.user;
        return user?.id ? 1000 : 500;
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: createKeyGenerator('global'),
    handler: rateLimitHandler,
    // Skip rate limiting in test environment
    skip: () => process.env.NODE_ENV === 'test',
});
/**
 * TIER 2: Authentication Rate Limiting
 * Stricter limits for authentication endpoints to prevent brute force attacks
 */
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes per IP
    keyGenerator: createKeyGenerator('auth'),
    handler: rateLimitHandler,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        error: {
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            type: 'AuthRateLimitError'
        }
    },
    // Skip rate limiting in test environment
    skip: () => process.env.NODE_ENV === 'test',
});
/**
 * TIER 3: Financial Operations Rate Limiting
 * Conservative limits for payment and loan operations
 */
exports.financialRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: (req) => {
        // Differentiate between different financial operations
        const path = req.path;
        if (path.includes('/fund') || path.includes('/repay')) {
            return 20; // 20 funding/repayment operations per hour
        }
        if (path.includes('/deposit') || path.includes('/withdraw')) {
            return 10; // 10 wallet operations per hour
        }
        if (path.includes('/create-loan')) {
            return 5; // 5 loan applications per hour
        }
        return 15; // Default for other financial operations
    },
    keyGenerator: createKeyGenerator('financial'),
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many financial operations. Please try again later.',
        error: {
            code: 'FINANCIAL_RATE_LIMIT_EXCEEDED',
            type: 'FinancialRateLimitError',
            suggestion: 'Financial operations are limited for security. Please wait before making more transactions.'
        }
    },
    // Skip rate limiting in test environment
    skip: () => process.env.NODE_ENV === 'test',
});
/**
 * TIER 4: API Rate Limiting
 * Moderate limits for general API operations
 */
exports.apiRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
        const user = req.user;
        return user?.id ? 200 : 50; // 200 for authenticated, 50 for anonymous
    },
    keyGenerator: createKeyGenerator('api'),
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'API rate limit exceeded. Please try again later.',
        error: {
            code: 'API_RATE_LIMIT_EXCEEDED',
            type: 'ApiRateLimitError'
        }
    },
    // Skip rate limiting in test environment
    skip: () => process.env.NODE_ENV === 'test',
});
/**
 * TIER 5: Slow Down Middleware
 * Progressively slow down requests as they approach the limit
 * This provides a smooth degradation rather than hard cutoff
 */
exports.speedLimiter = (0, express_slow_down_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: (req) => {
        const user = req.user;
        return user?.id ? 50 : 20; // Start slowing after 50 requests for auth users, 20 for anonymous
    },
    delayMs: () => 500, // Fixed delay per request above threshold
    maxDelayMs: 10000, // Maximum delay of 10 seconds
    keyGenerator: createKeyGenerator('speed'),
    // Skip delay for critical endpoints
    skip: (req) => {
        // Skip in test environment
        if (process.env.NODE_ENV === 'test')
            return true;
        const criticalPaths = ['/api/auth/verify', '/api/auth/refresh'];
        return criticalPaths.some(path => req.path === path);
    }
});
/**
 * TIER 6: Password Reset Rate Limiting
 * Special limiting for password reset to prevent email spam
 */
exports.passwordResetRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Only 3 password reset requests per hour per IP
    keyGenerator: createKeyGenerator('password-reset'),
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many password reset requests. Please try again in an hour.',
        error: {
            code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
            type: 'PasswordResetRateLimitError',
            suggestion: 'Password reset requests are limited to prevent spam. Please check your email or wait an hour.'
        }
    },
    // Skip rate limiting in test environment
    skip: () => process.env.NODE_ENV === 'test',
});
/**
 * TIER 7: Email Verification Rate Limiting
 * Prevent spam verification email requests
 */
exports.emailVerificationRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, // 3 verification emails per 10 minutes
    keyGenerator: createKeyGenerator('email-verification'),
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many verification email requests. Please check your email or try again in 10 minutes.',
        error: {
            code: 'EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED',
            type: 'EmailVerificationRateLimitError'
        }
    },
    // Skip rate limiting in test environment
    skip: () => process.env.NODE_ENV === 'test',
});
/**
 * Utility function to create custom rate limiters for specific endpoints
 */
const createCustomRateLimit = (options) => {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs,
        max: options.max,
        keyGenerator: createKeyGenerator(options.keyPrefix),
        handler: rateLimitHandler,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        message: {
            success: false,
            message: options.message || 'Rate limit exceeded for this operation.',
            error: {
                code: 'CUSTOM_RATE_LIMIT_EXCEEDED',
                type: 'CustomRateLimitError'
            }
        }
    });
};
exports.createCustomRateLimit = createCustomRateLimit;
/**
 * Rate limiting configuration summary:
 *
 * 1. Global: 300/1000 requests per 15min (anonymous/authenticated)
 * 2. Authentication: 5 attempts per 15min
 * 3. Financial: 5-20 operations per hour (varies by operation)
 * 4. API: 50/200 requests per 15min (anonymous/authenticated)
 * 5. Speed Limiter: Progressive delay after 20/50 requests
 * 6. Password Reset: 3 requests per hour
 * 7. Email Verification: 3 requests per 10min
 */
