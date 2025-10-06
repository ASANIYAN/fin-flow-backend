# Peer-to-Peer (P2P) Lending API (Backend)

## Project Overview & Features

The **Peer-to-Peer (P2P) Lending API** is a robust, secure backend solution designed to facilitate seamless financial operations in a decentralized lending ecosystem. Built with a focus on scalability, security, and reliability, this API empowers users to engage in P2P loan transactions while ensuring data integrity and compliance with modern financial standards.

Key features include:

- **User Authentication**: Secure JWT-based authentication with email verification, password reset, and role-based access control.
- **Profile Management**: Comprehensive user profile handling, including personal details and account verification.
- **Loan Creation and Management**: Full lifecycle support for creating, approving, and managing P2P loans with interest calculations and repayment tracking.
- **Real-time Transaction History**: Paginated and searchable transaction logs for transparent financial tracking.
- **Secure Payment Gateway Integration**: Seamless integration with Paystack for processing payments, webhooks, and account resolution.

## Architecture & Design

This API follows a **Layered Architecture** pattern, promoting separation of concerns, maintainability, and testability. The architecture is structured as follows:

- **Routes Layer**: Defines API endpoints and applies middleware such as authentication and validation.
- **Controllers Layer**: Handles HTTP request/response cycles, input validation, and delegates business logic to services.
- **Services Layer**: Contains all business logic, including loan calculations, transaction processing, and external API integrations (e.g., Paystack).
- **ORM/Prisma Layer**: Manages database interactions with type-safe queries and migrations.

### Role of Layers

- **Controllers** focus on request/response handling and context setting, ensuring clean separation from business logic.
- **Services** encapsulate pure business logic, such as interest rate computations, balance updates, and external service calls, making them easily testable in isolation.

### Data Validation

A custom **Validation Utility** is employed to enforce data integrity early in the request pipeline, preventing invalid data from reaching the business logic layers.

### Middleware

The `authenticateToken` middleware enforces security on protected routes, validating JWT tokens and ensuring only authorized users can access sensitive endpoints.

## Testing Strategy

This project adopts a **Test-Driven Development (TDD)** approach, ensuring high code quality and reliability through comprehensive testing.

We utilize the **Testing Pyramid** model:

- **Unit Tests**: Primarily target the Service layer, testing pure business logic in isolation from HTTP concerns and external dependencies.
- **Integration Tests**: Focus on the Controller and Route layers, verifying end-to-end data flow, authentication mechanisms, and mocked external API interactions (e.g., Paystack payment processing).
- **End-to-End Tests**: Validate complete user workflows across the application.

All tests are written using Jest, with SQLite as the test database for fast, isolated execution.

## API Endpoints

The API provides RESTful endpoints for all core functionalities. Below is a summary of key endpoints:

| Method | Endpoint                        | Description                                       |
| ------ | ------------------------------- | ------------------------------------------------- |
| POST   | `/api/auth/signup`              | Create a new user account with email verification |
| POST   | `/api/auth/login`               | Authenticate user and return JWT token            |
| GET    | `/api/auth/verify-email/:token` | Verify user email address                         |
| POST   | `/api/auth/resend-verification` | Resend email verification link                    |
| POST   | `/api/auth/forgot-password`     | Initiate password reset process                   |
| POST   | `/api/auth/reset-password`      | Reset user password                               |
| GET    | `/api/user/profile`             | Retrieve user profile information                 |
| POST   | `/api/loans`                    | Create a new loan request                         |
| GET    | `/api/loans`                    | List user's loans with pagination                 |
| GET    | `/api/loans/:id`                | Get details of a specific loan                    |
| POST   | `/api/loans/:id/repay`          | Process loan repayment                            |
| POST   | `/api/wallet/fund`              | Fund user wallet via Paystack                     |
| POST   | `/api/wallet/transfer`          | Transfer funds between users                      |
| GET    | `/api/paystack/banks`           | Retrieve list of supported banks                  |
| POST   | `/api/paystack/webhook`         | Handle Paystack webhook for transaction updates   |
| POST   | `/api/paystack/resolve-account` | Resolve bank account name for transfers           |

The Paystack webhook endpoint (`POST /api/paystack/webhook`) plays a crucial role in maintaining eventual consistency for user balances, processing real-time payment confirmations.

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
   ```

   **Note**: Ensure `JWT_SECRET` is a strong, randomly generated string for token security. `PAYSTACK_SECRET_KEY` is required for payment processing and should be obtained from your Paystack dashboard.

4. **Set up the database**:

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Run the application**:

   ```bash
   npm run dev
   ```

6. **Run tests**:
   ```bash
   npm test
   ```

The API will be available at `http://localhost:3000`, with Swagger documentation at `http://localhost:3000/api-docs`.
