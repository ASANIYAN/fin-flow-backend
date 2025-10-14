# Peer-to-Peer (P2P) Lending API (Backend)

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16+-purple.svg)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://postgresql.org/)
[![Jest](https://img.shields.io/badge/Jest-29+-red.svg)](https://jestjs.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Enterprise-grade P2P lending API with comprehensive security, multi-tiered rate limiting, and unified borrower-lender functionality**

## Project Overview & Features

The **Peer-to-Peer (P2P) Lending API** is a robust, secure, and production-ready backend solution designed to facilitate seamless financial operations in a unified P2P lending ecosystem. Built with enterprise-grade security, comprehensive rate limiting, and a focus on scalability and reliability, this API empowers users to participate in peer-to-peer lending as **both borrowers AND lenders** within a single, flexible platform.

### Unified User Model

Unlike traditional P2P platforms that require separate borrower and lender accounts, our system features a **unified user architecture** where:

- **Every user can be both a borrower and a lender** without role restrictions
- Users can **seamlessly switch between requesting loans and funding others' loans**
- **Dynamic role assignment** based on user actions rather than static account types
- **Comprehensive dashboard** showing both borrowing and lending activities in one view

### Key Features

#### **Core Functionality**
- **User Authentication**: Secure JWT-based authentication with email verification, password reset, and unified access control
- **Flexible Profile Management**: Comprehensive user profile handling supporting dual-role functionality
- **Complete Loan Lifecycle Management**: Full CRUD operations including creation, funding, repayment, and deletion with interest calculations and repayment tracking
- **Unified Transaction History**: Paginated and searchable transaction logs covering both borrowing and lending activities
- **Smart Wallet System**: Integrated wallet with available and escrow balance management for secure P2P transactions
- **Secure Payment Gateway Integration**: Seamless integration with Paystack for processing payments, webhooks, and account resolution

#### **Security & Performance Features**
- **🔒 Multi-Tiered Rate Limiting**: 7-tier comprehensive rate limiting system protecting against DDoS, brute force attacks, and financial fraud
- **🛡️ Advanced Security**: IPv6 support, intelligent key generation, and environment-aware configurations
- **⚡ Performance Optimized**: Duplicate transaction prevention, graceful error handling, and optimized database queries
- **📊 Enhanced Data Models**: Duration units support, comprehensive loan status tracking, and improved data validation

#### **Enterprise-Grade Security**
- **Global Rate Limiting**: 1000 requests/15min (authenticated) | 500/15min (anonymous)
- **Authentication Protection**: 5 attempts/15min for login/signup endpoints
- **Financial Operations Security**: Conservative limits on loan creation (5/hour), funding/repayment (20/hour), wallet operations (10/hour)
- **Progressive Speed Limiting**: Gradual delays instead of hard cutoffs for better UX
- **Specialized Protection**: Password reset (3/hour) and email verification (3/10min) limits

## Architecture & Design

This API follows a **Layered Architecture** pattern with **enterprise-grade security** and **comprehensive protection mechanisms**, promoting separation of concerns, maintainability, and testability. The architecture is structured as follows:

- **Routes Layer**: Defines API endpoints with multi-tiered rate limiting, authentication middleware, and input validation
- **Controllers Layer**: Handles HTTP request/response cycles, input validation, and delegates business logic to services
- **Services Layer**: Contains all business logic, including loan calculations, transaction processing, duplicate prevention, and external API integrations (e.g., Paystack)
- **ORM/Prisma Layer**: Manages database interactions with type-safe queries, optimized connections, and migrations
- **Security Layer**: Multi-tiered rate limiting, JWT authentication, and comprehensive API protection

### Security Architecture

#### **Multi-Tiered Rate Limiting System**
Our API implements a comprehensive 7-tier rate limiting strategy:

1. **Global Rate Limiting** - Overall API protection against DDoS attacks
2. **Authentication Rate Limiting** - Brute force protection for login/signup endpoints
3. **Financial Operations Rate Limiting** - Fraud prevention for monetary transactions
4. **API Rate Limiting** - General usage control for data endpoints
5. **Progressive Speed Limiting** - Gradual response delays for smooth degradation
6. **Password Reset Rate Limiting** - Email spam prevention
7. **Email Verification Rate Limiting** - Verification abuse protection

#### **Intelligent Protection Features**
- **User-based tracking** for authenticated requests
- **IP-based tracking** with IPv6 support for anonymous users
- **Environment-aware configuration** (disabled in test environments)
- **Comprehensive error responses** with retry information
- **Standard rate limiting headers** for client optimization

### Role of Layers

- **Controllers** focus on request/response handling and context setting, ensuring clean separation from business logic
- **Services** encapsulate pure business logic, such as interest rate computations, balance updates, duplicate transaction prevention, and external service calls, making them easily testable in isolation
- **Security Layer** provides comprehensive protection without impacting business logic or user experience

### Data Validation & Integrity

- **Custom Validation Utility** enforces data integrity early in the request pipeline
- **Duplicate transaction prevention** in wallet operations
- **Enhanced data models** with duration units and comprehensive loan status tracking
- **Graceful error handling** with detailed error responses

### Middleware

- **`authenticateToken`** middleware enforces security on protected routes
- **Rate limiting middleware** provides multi-tiered API protection
- **Validation middleware** ensures data integrity

## Testing Strategy

This project adopts a **Test-Driven Development (TDD)** approach with **comprehensive security testing**, ensuring high code quality, reliability, and security compliance through extensive testing.

We utilize the **Testing Pyramid** model:

- **Unit Tests**: Primarily target the Service layer, testing pure business logic in isolation from HTTP concerns and external dependencies, including rate limiting logic and security functions
- **Integration Tests**: Focus on the Controller and Route layers, verifying end-to-end data flow, authentication mechanisms, rate limiting behavior, and mocked external API interactions (e.g., Paystack payment processing)
- **End-to-End Tests**: Validate complete user workflows across the application, including security scenarios and rate limiting edge cases
- **Security Tests**: Validate rate limiting effectiveness, authentication security, and API protection mechanisms

### Testing Features
- **Environment-aware rate limiting**: Automatically disabled in test environments for clean testing
- **Comprehensive test coverage**: All new features including loan deletion, duration units, and duplicate transaction prevention
- **Performance testing**: Validates rate limiting performance impact and system scalability
- **Security validation**: Tests for brute force protection, DDoS mitigation, and fraud prevention

All tests are written using Jest, with SQLite as the test database for fast, isolated execution. The test suite includes **90+ tests** covering all critical functionality and security features.

## API Endpoints

The API provides RESTful endpoints for all core functionalities in our unified P2P lending platform. Below is a comprehensive summary of available endpoints:

### Authentication Endpoints

| Method | Endpoint                        | Description                                       | Rate Limit Applied |
| ------ | ------------------------------- | ------------------------------------------------- | ------------------ |
| POST   | `/api/auth/signup`              | Create a new user account with email verification | Auth Rate Limit   |
| POST   | `/api/auth/login`               | Authenticate user and return JWT token            | Auth Rate Limit   |
| GET    | `/api/auth/verify-email/:token` | Verify user email address                         | Email Verification Rate Limit |
| POST   | `/api/auth/resend-verification` | Resend email verification link                    | Email Verification Rate Limit |
| POST   | `/api/auth/forgot-password`     | Initiate password reset process                   | Password Reset Rate Limit |
| POST   | `/api/auth/reset-password`      | Reset user password                               | Password Reset Rate Limit |

### User Profile & Account Management

| Method | Endpoint                 | Description                                   | Rate Limit Applied |
| ------ | ------------------------ | --------------------------------------------- | ------------------ |
| GET    | `/api/user/profile`      | Retrieve user profile information             | API Rate Limit    |
| PATCH  | `/api/user/profile`      | Update user profile details                   | API Rate Limit    |
| GET    | `/api/user/transactions` | Get paginated transaction history with search | API Rate Limit    |

### Loan Management (Unified Borrowing & Lending)

| Method | Endpoint                   | Description                                          | Rate Limit Applied |
| ------ | -------------------------- | ---------------------------------------------------- | ------------------ |
| GET    | `/api/loans/dashboard`     | Get unified dashboard (borrower + lender activities) | API Rate Limit    |
| POST   | `/api/loans/create-loan`   | Create a new loan request (borrower role)            | Financial Rate Limit |
| GET    | `/api/loans/my-loans`      | List user's loan applications with pagination        | API Rate Limit    |
| GET    | `/api/loans/open`          | Browse available loans for funding (lender role)     | API Rate Limit    |
| GET    | `/api/loans/funded`        | View loans you've funded (lender role)               | API Rate Limit    |
| POST   | `/api/loans/:id/fund`      | Fund a loan (lender role)                            | Financial Rate Limit |
| POST   | `/api/loans/:loanId/repay` | Process loan repayment (borrower role)               | Financial Rate Limit |
| DELETE | `/api/loans/:id/delete`    | Delete pending loan application (borrower role)      | Financial Rate Limit |

### Wallet Management

| Method | Endpoint               | Description                          | Rate Limit Applied |
| ------ | ---------------------- | ------------------------------------ | ------------------ |
| POST   | `/api/wallet/deposit`  | Deposit funds to wallet via Paystack | Financial Rate Limit |
| POST   | `/api/wallet/withdraw` | Withdraw funds from wallet           | Financial Rate Limit |

### Payment Gateway (Paystack Integration)

| Method | Endpoint                        | Description                                     | Rate Limit Applied |
| ------ | ------------------------------- | ----------------------------------------------- | ------------------ |
| GET    | `/api/paystack/banks`           | Retrieve list of supported banks                | API Rate Limit    |
| POST   | `/api/paystack/webhook`         | Handle Paystack webhook for transaction updates | No Rate Limit (Webhook) |
| POST   | `/api/paystack/resolve-account` | Resolve bank account name for transfers         | Financial Rate Limit |

### Rate Limiting Information

Our API implements comprehensive rate limiting to ensure security, performance, and fair usage:

#### **Rate Limit Tiers**
- **Auth Rate Limit**: 5 requests/15min (login, signup, password reset, email verification)
- **Financial Rate Limit**: 5-20 requests/hour based on operation (loans: 5/hour, funding/repayment: 20/hour, wallet: 10/hour)
- **API Rate Limit**: 200 requests/15min (authenticated) | 100 requests/15min (anonymous)
- **Global Rate Limit**: 1000 requests/15min (authenticated) | 500 requests/15min (anonymous)

#### **Rate Limit Headers**
All responses include standard rate limiting headers:
- `X-RateLimit-Limit`: The rate limit ceiling for the endpoint
- `X-RateLimit-Remaining`: Number of requests left in the current window
- `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)
- `Retry-After`: Seconds to wait before retrying (when limit exceeded)

### Key Features of the Unified System:

- **Dashboard Integration**: The `/api/loans/dashboard` endpoint provides a comprehensive view of both borrowing and lending activities
- **Role Flexibility**: Users can create loans (`/api/loans/create-loan`) and fund others' loans (`/api/loans/:id/fund`) seamlessly
- **Complete Loan Lifecycle**: Now includes loan deletion (`/api/loans/:id/delete`) for pending applications with no funding
- **Enhanced Data Models**: Duration units support (days, weeks, months, years) for flexible loan terms
- **Dual Perspectives**:
  - `/api/loans/my-loans` shows loans you've applied for (borrower view)
  - `/api/loans/funded` shows loans you've invested in (lender view)
  - `/api/loans/open` shows investment opportunities (market view)
- **Smart Search**: All listing endpoints support pagination and search functionality for efficient data retrieval
- **Advanced Security**: Multi-tiered rate limiting protects against abuse while maintaining excellent user experience
- **Duplicate Prevention**: Wallet operations include sophisticated duplicate transaction prevention
- **Performance Optimized**: Enhanced database connection handling and optimized queries

The Paystack webhook endpoint (`POST /api/paystack/webhook`) plays a crucial role in maintaining eventual consistency for user balances, processing real-time payment confirmations for both deposits and loan-related transactions with improved duplicate handling.

## Setup & Installation

Follow these steps to set up the development environment:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/ASANIYAN/fin-flow-backend.git
   cd fin-flow-backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory with the following critical variables:

   ```env
   JWT_SECRET=your-super-secure-jwt-secret-key
   PAYSTACK_SECRET_KEY=your-paystack-secret-key
   DATABASE_URL=your-database-connection-string
   NODE_ENV=development
   
   # Rate Limiting Configuration (Optional - defaults provided)
   RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
   RATE_LIMIT_MAX_GLOBAL=1000
   RATE_LIMIT_MAX_AUTH=5
   RATE_LIMIT_MAX_FINANCIAL=30
   RATE_LIMIT_MAX_API=200
   ```

   **Security Notes**: 
   - Ensure `JWT_SECRET` is a strong, randomly generated string for token security
   - `PAYSTACK_SECRET_KEY` is required for payment processing and should be obtained from your Paystack dashboard
   - Rate limiting is automatically disabled in test environments for clean testing

4. **Set up the database**:

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Run the application**:

   ```bash
   # Development mode with hot reload
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

6. **Run tests**:
   ```bash
   # Run all tests
   npm test
   
   # Run tests in watch mode
   npm run test:watch
   
   # Run tests with coverage
   npm run test:coverage
   ```

The API will be available at `http://localhost:8000`, with comprehensive Swagger documentation at `http://localhost:8000/api-docs`.

### Development Features
- **Hot Reload**: Automatic server restart on code changes
- **Environment-aware Rate Limiting**: Automatically disabled during testing
- **Comprehensive Logging**: Detailed logs for debugging and monitoring
- **Type Safety**: Full TypeScript support with strict typing
- **Database Migrations**: Seamless schema updates with Prisma

## Unified P2P Architecture

This platform implements a **unified peer-to-peer lending model** that eliminates traditional role barriers:

### Traditional vs. Unified Model

**Traditional P2P Platforms:**

- Separate borrower and lender accounts
- Static role assignment at registration
- Limited flexibility to switch roles
- Fragmented user experience

**Our Unified Model:**

- Single user account for all activities
- Dynamic role switching based on actions
- Comprehensive dashboard showing both perspectives
- Seamless transition between borrowing and lending

### User Journey Examples

**As a Borrower:**

1. User creates account → `/api/auth/signup`
2. Complete profile → `/api/user/profile`
3. Create loan request → `/api/loans/create-loan`
4. Monitor application status → `/api/loans/my-loans`
5. Receive funds and make repayments → `/api/loans/:loanId/repay`
6. Delete pending applications if needed → `/api/loans/:id/delete`

**As a Lender (Same User):**

1. Browse investment opportunities → `/api/loans/open`
2. Fund attractive loans → `/api/loans/:id/fund`
3. Track investment performance → `/api/loans/funded`
4. View returns and transaction history → `/api/user/transactions`

**Unified Dashboard:**

- View both borrowing and lending activities in one place → `/api/loans/dashboard`
- Track overall financial performance across all roles
- Make informed decisions based on complete financial picture
- Enhanced data includes duration units and comprehensive status tracking

## Security & Performance Features

### 🔒 Enterprise-Grade Security

#### **Multi-Tiered Rate Limiting**
- **7-tier protection system** covering all API endpoints
- **Intelligent key generation** with user-based and IP-based tracking
- **IPv6 support** for modern network infrastructure
- **Environment-aware** configuration (disabled in test environments)

#### **Advanced Protection Against**
- **DDoS attacks** via global rate limiting (1000 req/15min auth, 500 req/15min anon)
- **Brute force attacks** via authentication rate limiting (5 attempts/15min)
- **Financial fraud** via transaction rate limiting (5-20 req/hour based on operation)
- **Email spam** via verification rate limiting (3 req/10min)
- **Resource abuse** via API usage controls (200 req/15min auth, 100 req/15min anon)

#### **Security Headers & Standards**
- Standard rate limiting headers (`X-RateLimit-*`)
- Comprehensive error responses with retry information
- JWT-based authentication with secure token handling
- Input validation and sanitization at all layers

### ⚡ Performance Optimizations

#### **Database & Connection Management**
- **Enhanced Prisma connection handling** with singleton pattern
- **Optimized queries** with proper indexing and relationship loading
- **Duplicate transaction prevention** in wallet operations
- **Graceful error handling** with detailed logging

#### **API Performance**
- **Minimal rate limiting overhead** (~1-2ms per request)
- **Progressive speed limiting** for smooth degradation
- **Efficient pagination** and search across all endpoints
- **Cached responses** where appropriate

### 📊 Enhanced Data Models

#### **Loan Management Improvements**
- **Duration units support** (DAYS, WEEKS, MONTHS, YEARS)
- **Complete CRUD operations** including safe loan deletion
- **Enhanced status tracking** with proper enum validation
- **Improved interest calculations** with flexible time periods

#### **Transaction Management**
- **Duplicate prevention** in payment processing
- **Comprehensive transaction logging** with search capabilities
- **Atomic operations** for financial consistency
- **Real-time balance updates** with proper escrow handling

## Documentation & Monitoring

### 📖 Comprehensive Documentation
- **API Documentation**: Complete Swagger/OpenAPI 3.0 specification at `/api-docs`
- **Rate Limiting Guide**: Detailed documentation in `docs/rate-limiting-implementation.md`
- **Implementation Summary**: Complete feature overview in `docs/implementation-summary.md`
- **Architecture Documentation**: In-depth system design and security model

### 📈 Monitoring & Observability
- **Detailed error logging** with context and stack traces
- **Rate limiting metrics** and monitoring capabilities
- **Performance tracking** with request timing and resource usage
- **Security event logging** for audit trails and compliance

### 🧪 Testing & Quality Assurance
- **90+ comprehensive tests** covering all functionality
- **Security testing** for rate limiting and authentication
- **Performance testing** for scalability validation
- **Environment-aware testing** with proper isolation

## Recent Updates & Improvements

### 🚀 Latest Features (October 2024)

#### **Comprehensive Rate Limiting System**
- **Multi-tiered protection**: 7 different rate limiting strategies for various endpoint types
- **Intelligent tracking**: User-based for authenticated requests, IP-based with IPv6 support for anonymous
- **Environment awareness**: Automatically disabled in test environments for clean testing
- **Production ready**: Comprehensive error handling and monitoring capabilities

#### **Enhanced Loan Management**
- **Loan deletion functionality**: Safe deletion of pending loan applications with no funding
- **Duration units support**: Flexible loan terms with DAYS, WEEKS, MONTHS, YEARS options
- **Improved data models**: Enhanced loan responses with comprehensive status tracking
- **Better validation**: Stricter business rules and error handling

#### **Improved Financial Operations**
- **Duplicate transaction prevention**: Sophisticated handling of duplicate payment processing
- **Enhanced wallet operations**: Improved balance management and transaction logging
- **Optimized database connections**: Better Prisma connection handling and performance
- **Graceful error handling**: Improved error responses and recovery mechanisms

#### **Security Enhancements**
- **DDoS protection**: Global rate limiting prevents server overload
- **Brute force prevention**: Authentication endpoint protection with progressive delays
- **Financial fraud mitigation**: Conservative limits on monetary operations
- **API abuse prevention**: Comprehensive usage controls and monitoring

#### **Developer Experience Improvements**
- **Enhanced documentation**: Comprehensive API documentation and implementation guides
- **Better error messages**: Detailed error responses with actionable information
- **Type safety**: Full TypeScript support with strict typing
- **Testing improvements**: Environment-aware rate limiting and comprehensive test coverage

### 📋 Technical Debt & Performance
- **Database optimization**: Enhanced Prisma connection patterns and query optimization
- **Memory management**: Efficient rate limiting with automatic cleanup
- **Error handling**: Consistent error patterns across all endpoints
- **Code quality**: Improved maintainability and documentation

## Technology Stack & Dependencies

### Core Technologies
- **Runtime**: Node.js with TypeScript for type safety
- **Framework**: Express.js with comprehensive middleware stack
- **Database**: PostgreSQL with Prisma ORM for type-safe queries
- **Authentication**: JWT-based with bcrypt password hashing
- **Payment Processing**: Paystack integration for Nigerian payments
- **Testing**: Jest with comprehensive test suites

### Security & Performance
- **Rate Limiting**: express-rate-limit and express-slow-down
- **Input Validation**: Custom validation utilities with sanitization
- **CORS**: Configurable cross-origin resource sharing
- **Environment Management**: dotenv for configuration management

### Development Tools
- **TypeScript**: Full type safety and modern JavaScript features
- **Prisma**: Database toolkit with migrations and type generation
- **Swagger**: Comprehensive API documentation with OpenAPI 3.0
- **Jest**: Testing framework with coverage reporting

## Production Deployment

### Environment Configuration
```env
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-production-jwt-secret
PAYSTACK_SECRET_KEY=your-production-paystack-key

# Rate limiting configuration (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_GLOBAL=1000
RATE_LIMIT_MAX_AUTH=5
RATE_LIMIT_MAX_FINANCIAL=30
```

### Production Features
- **Horizontal scaling**: Ready for Redis-based rate limiting stores
- **Health checks**: Built-in health monitoring endpoints
- **Error tracking**: Comprehensive logging for production monitoring
- **Performance monitoring**: Rate limiting metrics and performance tracking

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Rate limiting storage configured (Redis for clusters)
- [ ] Monitoring and alerting set up
- [ ] SSL/TLS certificates configured
- [ ] CORS policies reviewed
- [ ] Backup strategies implemented

## Contributing

We welcome contributions to improve the FinFlow P2P Lending API! Please follow these guidelines:

### Development Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper tests
4. Ensure all tests pass (`npm test`)
5. Update documentation as needed
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update API documentation for endpoint changes
- Follow the existing architectural patterns
- Ensure rate limiting considerations for new endpoints

### Security Considerations
- All new endpoints must include appropriate rate limiting
- Financial operations require extra security validation
- Authentication must be implemented for protected routes
- Input validation is mandatory for all user inputs

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support & Contact

For support, questions, or contributions:
- **Repository**: [https://github.com/ASANIYAN/fin-flow-backend](https://github.com/ASANIYAN/fin-flow-backend)
- **Issues**: [GitHub Issues](https://github.com/ASANIYAN/fin-flow-backend/issues)
- **Documentation**: Available at `/api-docs` when running the server

---

**FinFlow P2P Lending API** - Empowering unified peer-to-peer lending with enterprise-grade security and performance. 🚀
