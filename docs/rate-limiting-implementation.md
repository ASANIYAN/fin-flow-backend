# Rate Limiting Implementation for FinFlow API

## Overview

This document provides a detailed explanation of the comprehensive rate limiting strategy implemented in the FinFlow P2P lending API. The implementation uses multiple tiers of rate limiting to protect against abuse while maintaining optimal user experience.

## Architecture

The rate limiting system consists of 7 different rate limiters, each designed for specific use cases:

### 1. Global Rate Limiting

- **Purpose**: Overall API protection
- **Limit**: 1000 requests per 15 minutes per IP/user
- **Applied to**: All API endpoints
- **Key Strategy**: IP-based for anonymous users, user ID-based for authenticated users

### 2. Authentication Rate Limiting

- **Purpose**: Protect against brute force attacks on login/signup
- **Limit**: 10 requests per 15 minutes
- **Applied to**: `/api/auth/signup`, `/api/auth/login`
- **Special Feature**: Stricter limits for security-sensitive operations

### 3. Financial Operations Rate Limiting

- **Purpose**: Prevent rapid financial transactions that could indicate fraud
- **Limit**: 30 requests per 15 minutes
- **Applied to**:
  - Loan creation (`/api/loans/create-loan`)
  - Loan funding (`/api/loans/:id/fund`)
  - Loan repayment (`/api/loans/:loanId/repay`)
  - Loan deletion (`/api/loans/:id/delete`)
  - Wallet deposits (`/api/wallet/deposit`)
  - Wallet withdrawals (`/api/wallet/withdraw`)
  - Account resolution (`/api/paystack/resolve-account`)

### 4. API Rate Limiting

- **Purpose**: General API usage control
- **Limit**: 200 requests per 15 minutes
- **Applied to**:
  - Dashboard data (`/api/loans/dashboard`)
  - User loans listing (`/api/loans/my-loans`)
  - Open loans listing (`/api/loans/open`)
  - Funded loans listing (`/api/loans/funded`)
  - User profile operations (`/api/user/profile`)
  - User transactions (`/api/user/transactions`)
  - Bank listings (`/api/paystack/banks`)

### 5. Speed Limiting (Progressive Delay)

- **Purpose**: Gradually slow down requests as they increase
- **Configuration**:
  - Start delay after 50 requests in 15 minutes
  - Maximum delay: 5 seconds
  - Increment: 100ms per additional request
- **Applied to**: All endpoints globally

### 6. Password Reset Rate Limiting

- **Purpose**: Prevent abuse of password reset functionality
- **Limit**: 5 requests per hour
- **Applied to**:
  - `/api/auth/forgot-password`
  - `/api/auth/reset-password`

### 7. Email Verification Rate Limiting

- **Purpose**: Prevent email spam and verification abuse
- **Limit**: 10 requests per hour
- **Applied to**:
  - `/api/auth/verify-email/:token`
  - `/api/auth/resend-verification`

## Technical Implementation

### Key Generator Strategy

The rate limiting system uses intelligent key generation that adapts based on user authentication status:

```typescript
const createKeyGenerator = (prefix: string) => {
  return (req: Request): string => {
    // For authenticated requests, use user ID
    const user = (req as any).user;
    if (user?.id) {
      return `${prefix}:user:${user.id}`;
    }

    // For unauthenticated requests, use IP address
    const forwardedFor = req.headers["x-forwarded-for"] as string;
    const clientIp =
      forwardedFor?.split(",")[0] || req.connection.remoteAddress || req.ip;
    return `${prefix}:ip:${clientIp}`;
  };
};
```

### Error Handling

When rate limits are exceeded, the API returns a structured error response:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "type": "RateLimitError",
    "retryAfter": 60,
    "limit": 100,
    "remaining": 0,
    "resetTime": "2024-01-01T12:00:00.000Z",
    "userType": "authenticated",
    "suggestion": "You have exceeded the rate limit for authenticated users. Please wait before making more requests."
  }
}
```

### Headers Included

The implementation automatically includes standard rate limiting headers:

- `X-RateLimit-Limit`: The rate limit ceiling for the endpoint
- `X-RateLimit-Remaining`: The number of requests left in the current window
- `X-RateLimit-Reset`: The time when the rate limit resets (Unix timestamp)
- `Retry-After`: Number of seconds to wait before retrying (when limit exceeded)

## Security Benefits

### 1. DDoS Protection

- Global rate limiting prevents overwhelming the server
- Progressive speed limiting adds additional protection

### 2. Brute Force Prevention

- Authentication endpoints have strict limits
- Password reset functionality is heavily restricted

### 3. Financial Fraud Prevention

- Financial operations have moderate limits to prevent rapid fraudulent transactions
- Account resolution is rate-limited to prevent reconnaissance attacks

### 4. Resource Conservation

- API rate limiting prevents excessive database queries
- Email verification limits prevent spam

### 5. Fair Usage

- Per-user limits ensure fair resource distribution
- Different tiers allow legitimate high-volume users while blocking abuse

## Performance Considerations

### Memory Usage

- Uses in-memory storage by default (suitable for single-instance deployments)
- Can be configured to use Redis for production clusters
- Automatic cleanup of expired entries

### Response Time Impact

- Minimal overhead (~1-2ms per request)
- Asynchronous processing doesn't block request handling
- Pre-computed rate limit headers

### Scalability

- Supports both IP-based and user-based tracking
- Can be extended to use external stores (Redis, MongoDB)
- Configurable time windows and limits

## Configuration Management

All rate limits are centrally configured in `/src/middleware/rateLimiting.ts`:

```typescript
// Example configuration
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Maximum requests per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator("global"),
  handler: rateLimitHandler,
});
```

## Testing Strategy

### Unit Tests

- Test rate limit enforcement
- Verify key generation logic
- Check error response format

### Integration Tests

- Test rate limits across different endpoints
- Verify authentication-based key switching
- Test progressive delay functionality

### Load Tests

- Verify rate limiting under high load
- Test memory usage with many concurrent users
- Measure performance impact

## Monitoring and Alerting

### Metrics to Track

- Rate limit hit rates by endpoint
- Top rate-limited IPs/users
- Performance impact measurements
- Error rates related to rate limiting

### Recommended Alerts

- High rate limit hit rates (potential attack)
- Rate limiting service failures
- Memory usage spikes in rate limiting store

## Production Deployment

### Environment Variables

```env
# Rate limiting configuration
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_GLOBAL=1000
RATE_LIMIT_MAX_AUTH=10
RATE_LIMIT_MAX_FINANCIAL=30
RATE_LIMIT_MAX_API=200
```

### Redis Configuration (for clusters)

```typescript
// Example Redis store configuration
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL);

const store = new RedisStore({
  client: redisClient,
  prefix: "rl:",
});
```

## Compliance and Legal

### GDPR Considerations

- IP addresses are considered personal data
- Implement data retention policies
- Provide mechanisms for data deletion requests

### Financial Regulations

- Rate limiting helps comply with anti-fraud requirements
- Audit trails for all rate limiting decisions
- Configurable limits to meet regulatory requirements

## Future Enhancements

### 1. Dynamic Rate Limiting

- Adjust limits based on user behavior patterns
- Higher limits for verified premium users
- Temporary limit increases during peak usage

### 2. Geographic Rate Limiting

- Different limits based on geographic regions
- Enhanced protection for high-risk locations

### 3. ML-Based Detection

- Use machine learning to detect anomalous patterns
- Adaptive rate limiting based on threat intelligence

### 4. Circuit Breaker Integration

- Automatic failover when rate limiting service is down
- Graceful degradation strategies

## Conclusion

The implemented rate limiting system provides comprehensive protection against various types of abuse while maintaining excellent user experience. The multi-tiered approach ensures that different types of operations receive appropriate protection levels, from strict authentication limits to more lenient API browsing limits.

The system is designed to be:

- **Secure**: Multiple layers of protection against various attack vectors
- **Scalable**: Can handle high-volume legitimate traffic
- **Maintainable**: Centralized configuration and clear documentation
- **Flexible**: Easy to adjust limits and add new tiers as needed

This implementation serves as a robust foundation for API security in the FinFlow P2P lending platform.
