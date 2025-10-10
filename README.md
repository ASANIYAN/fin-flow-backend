# Peer-to-Peer (P2P) Lending API (Backend)

## Project Overview & Features

The **Peer-to-Peer (P2P) Lending API** is a robust, secure backend solution designed to facilitate seamless financial operations in a unified P2P lending ecosystem. Built with a focus on scalability, security, and reliability, this API empowers users to participate in peer-to-peer lending as **both borrowers AND lenders** within a single, flexible platform.

### Unified User Model

Unlike traditional P2P platforms that require separate borrower and lender accounts, our system features a **unified user architecture** where:

- **Every user can be both a borrower and a lender** without role restrictions
- Users can **seamlessly switch between requesting loans and funding others' loans**
- **Dynamic role assignment** based on user actions rather than static account types
- **Comprehensive dashboard** showing both borrowing and lending activities in one view

Key features include:

- **User Authentication**: Secure JWT-based authentication with email verification, password reset, and unified access control.
- **Flexible Profile Management**: Comprehensive user profile handling supporting dual-role functionality.
- **Dual-Role Loan Management**: Full lifecycle support for creating loan requests (as borrower) and funding loans (as lender) with interest calculations and repayment tracking.
- **Unified Transaction History**: Paginated and searchable transaction logs covering both borrowing and lending activities.
- **Smart Wallet System**: Integrated wallet with available and escrow balance management for secure P2P transactions.
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

The API provides RESTful endpoints for all core functionalities in our unified P2P lending platform. Below is a comprehensive summary of available endpoints:

### Authentication Endpoints

| Method | Endpoint                        | Description                                       |
| ------ | ------------------------------- | ------------------------------------------------- |
| POST   | `/api/auth/signup`              | Create a new user account with email verification |
| POST   | `/api/auth/login`               | Authenticate user and return JWT token            |
| GET    | `/api/auth/verify-email/:token` | Verify user email address                         |
| POST   | `/api/auth/resend-verification` | Resend email verification link                    |
| POST   | `/api/auth/forgot-password`     | Initiate password reset process                   |
| POST   | `/api/auth/reset-password`      | Reset user password                               |

### User Profile & Account Management

| Method | Endpoint                 | Description                                   |
| ------ | ------------------------ | --------------------------------------------- |
| GET    | `/api/user/profile`      | Retrieve user profile information             |
| PATCH  | `/api/user/profile`      | Update user profile details                   |
| GET    | `/api/user/transactions` | Get paginated transaction history with search |

### Loan Management (Unified Borrowing & Lending)

| Method | Endpoint                   | Description                                          |
| ------ | -------------------------- | ---------------------------------------------------- |
| GET    | `/api/loans/dashboard`     | Get unified dashboard (borrower + lender activities) |
| POST   | `/api/loans/create-loan`   | Create a new loan request (borrower role)            |
| GET    | `/api/loans/my-loans`      | List user's loan applications with pagination        |
| GET    | `/api/loans/open`          | Browse available loans for funding (lender role)     |
| GET    | `/api/loans/funded`        | View loans you've funded (lender role)               |
| POST   | `/api/loans/:id/fund`      | Fund a loan (lender role)                            |
| POST   | `/api/loans/:loanId/repay` | Process loan repayment (borrower role)               |

### Wallet Management

| Method | Endpoint               | Description                          |
| ------ | ---------------------- | ------------------------------------ |
| POST   | `/api/wallet/deposit`  | Deposit funds to wallet via Paystack |
| POST   | `/api/wallet/withdraw` | Withdraw funds from wallet           |

### Payment Gateway (Paystack Integration)

| Method | Endpoint                        | Description                                     |
| ------ | ------------------------------- | ----------------------------------------------- |
| GET    | `/api/paystack/banks`           | Retrieve list of supported banks                |
| POST   | `/api/paystack/webhook`         | Handle Paystack webhook for transaction updates |
| POST   | `/api/paystack/resolve-account` | Resolve bank account name for transfers         |

### Key Features of the Unified System:

- **Dashboard Integration**: The `/api/loans/dashboard` endpoint provides a comprehensive view of both borrowing and lending activities
- **Role Flexibility**: Users can create loans (`/api/loans/create-loan`) and fund others' loans (`/api/loans/:id/fund`) seamlessly
- **Dual Perspectives**:
  - `/api/loans/my-loans` shows loans you've applied for (borrower view)
  - `/api/loans/funded` shows loans you've invested in (lender view)
  - `/api/loans/open` shows investment opportunities (market view)
- **Smart Search**: All listing endpoints support pagination and search functionality for efficient data retrieval

The Paystack webhook endpoint (`POST /api/paystack/webhook`) plays a crucial role in maintaining eventual consistency for user balances, processing real-time payment confirmations for both deposits and loan-related transactions.

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

The API will be available at `http://localhost:8000`, with comprehensive Swagger documentation at `http://localhost:8000/api-docs`.

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

**As a Lender (Same User):**

1. Browse investment opportunities → `/api/loans/open`
2. Fund attractive loans → `/api/loans/:id/fund`
3. Track investment performance → `/api/loans/funded`
4. View returns and transaction history → `/api/user/transactions`

**Unified Dashboard:**

- View both borrowing and lending activities in one place → `/api/loans/dashboard`
- Track overall financial performance across all roles
- Make informed decisions based on complete financial picture
