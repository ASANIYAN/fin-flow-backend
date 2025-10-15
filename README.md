# FinFlow P2P Lending API

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-lightgrey.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A secure and scalable peer-to-peer lending platform API built with Node.js, TypeScript, and PostgreSQL.

## Features

- **Unified User Model**: Users can act as both borrowers and lenders
- **Secure Authentication**: JWT-based with email verification
- **Loan Management**: Create, fund, repay, and manage loans
- **Wallet System**: Integrated payment processing with Paystack
- **Rate Limiting**: Multi-tiered protection against abuse
- **Real-time Updates**: Webhook integration for payment confirmations

## Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt
- **Payments**: Paystack integration
- **Testing**: Jest
- **Rate Limiting**: express-rate-limit

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create user account
- `POST /api/auth/login` - User login
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### User Management

- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update profile
- `GET /api/user/transactions` - Transaction history

### Loans

- `GET /api/loans/dashboard` - User dashboard
- `POST /api/loans/create-loan` - Create loan request
- `GET /api/loans/my-loans` - User's loans
- `GET /api/loans/open` - Available loans
- `GET /api/loans/funded` - Funded loans
- `POST /api/loans/:id/fund` - Fund a loan
- `POST /api/loans/:loanId/repay` - Repay loan
- `DELETE /api/loans/:id/delete` - Delete pending loan

### Wallet

- `POST /api/wallet/deposit` - Deposit funds
- `POST /api/wallet/withdraw` - Withdraw funds

### Payments

- `GET /api/paystack/banks` - Get bank list
- `POST /api/paystack/resolve-account` - Resolve bank account

## Setup & Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ASANIYAN/fin-flow-backend.git
   cd fin-flow-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment variables**
   Create a `.env` file:

   ```env
   JWT_SECRET=your-jwt-secret
   PAYSTACK_SECRET_KEY=your-paystack-key
   DATABASE_URL=your-database-url
   NODE_ENV=development
   ```

4. **Database setup**

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Run the application**

   ```bash
   npm run dev
   ```

6. **Run tests**
   ```bash
   npm test
   ```

The API will be available at `http://localhost:8000` with documentation at `http://localhost:8000/api-docs`.

## Support

- **Repository**: [GitHub](https://github.com/ASANIYAN/fin-flow-backend)
- **Issues**: [GitHub Issues](https://github.com/ASANIYAN/fin-flow-backend/issues)
- **Documentation**: Available at `/api-docs` when running
