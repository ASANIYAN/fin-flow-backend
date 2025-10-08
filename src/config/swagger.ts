import swaggerJSDoc, { Options } from "swagger-jsdoc";
import path from "path";

const options: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FinFlow API",
      version: "1.0.0",
      description:
        "A comprehensive financial application API with authentication and user management",
      contact: {
        name: "FinFlow Team",
        email: "support@finflow.com",
      },
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Development server",
      },
      {
        url: "https://fin-flow-backend.onrender.com",
        description: "Production server",
      },
    ],
    components: {
      schemas: {
        User: {
          type: "object",
          required: ["id", "email", "firstName", "lastName"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "User unique identifier (UUID)",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
              example: "fostogokka@necub.com",
            },
            firstName: {
              type: "string",
              description: "User first name",
              example: "John",
            },
            lastName: {
              type: "string",
              description: "User last name",
              example: "Doe",
            },
            isEmailVerified: {
              type: "boolean",
              description: "Whether the user email is verified",
              example: false,
            },
            emailVerifiedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
              description: "Timestamp when email was verified",
              example: "2024-01-01T00:00:00.000Z",
            },
            availableBalance: {
              type: "number",
              format: "decimal",
              description: "Funds ready for use/withdrawal",
              example: 50000.0,
            },
            escrowBalance: {
              type: "number",
              format: "decimal",
              description: "Funds committed to PENDING/FUNDING loans",
              example: 10000.0,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "User creation timestamp",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        SignupRequest: {
          type: "object",
          required: [
            "email",
            "password",
            "confirmPassword",
            "firstName",
            "lastName",
          ],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User email address",
              example: "fostogokka@necub.com",
            },
            password: {
              type: "string",
              minLength: 8,
              description: "User password (minimum 8 characters)",
              example: "Fostogokka123#&",
            },
            confirmPassword: {
              type: "string",
              description: "Password confirmation (must match password)",
              example: "Fostogokka123#&",
            },
            firstName: {
              type: "string",
              description: "User first name",
              example: "John",
            },
            lastName: {
              type: "string",
              description: "User last name",
              example: "Doe",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User email address",
              example: "fostogokka@necub.com",
            },
            password: {
              type: "string",
              description: "User password",
              example: "Fostogokka123#&",
            },
          },
        },
        ForgotPasswordRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User email address for password reset",
              example: "fostogokka@necub.com",
            },
          },
        },
        ResetPasswordRequest: {
          type: "object",
          required: ["token", "newPassword"],
          properties: {
            token: {
              type: "string",
              description: "Password reset token received via email",
              example: "",
            },
            newPassword: {
              type: "string",
              minLength: 8,
              description: "New password (minimum 8 characters)",
              example: "NewFostogokka123#&",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "User created successfully",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/User",
                },
                token: {
                  type: "object",
                  description: "Authentication token object",
                  properties: {
                    value: {
                      type: "string",
                      description: "JWT authentication token",
                      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    },
                    expiresAt: {
                      type: "string",
                      format: "date-time",
                      description: "Token expiration timestamp (ISO 8601)",
                      example: "2025-09-29T12:34:56.000Z",
                    },
                  },
                  required: ["value", "expiresAt"],
                },
              },
            },
          },
        },
        Loan: {
          type: "object",
          required: [
            "id",
            "title",
            "amountRequested",
            "interestRate",
            "duration",
            "durationUnit",
            "totalInterest",
            "status",
            "borrowerId",
          ],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Loan unique identifier (UUID)",
              example: "123e4567-e89b-12d3-a456-426614174001",
            },
            title: {
              type: "string",
              description: "Loan title or purpose",
              example: "Small Business Expansion",
            },
            description: {
              type: "string",
              description: "Detailed loan description (optional)",
              example: "Funding needed to expand our retail operations",
            },
            amountRequested: {
              type: "number",
              format: "decimal",
              description: "Amount requested for the loan",
              example: 50000.0,
            },
            amountFunded: {
              type: "number",
              format: "decimal",
              description: "Amount currently funded",
              example: 25000.0,
            },
            interestRate: {
              type: "number",
              format: "decimal",
              description: "Interest rate percentage",
              example: 12.5,
            },
            duration: {
              type: "integer",
              description:
                "Loan duration value (interpreted based on durationUnit)",
              example: 24,
            },
            durationUnit: {
              type: "string",
              enum: ["DAYS", "WEEKS", "MONTHS", "YEARS"],
              description: "Unit for the duration field",
              example: "MONTHS",
            },
            totalInterest: {
              type: "number",
              format: "decimal",
              description:
                "Total interest amount calculated based on amount, rate, and duration",
              example: 12500.0,
            },
            principalRepaid: {
              type: "number",
              format: "decimal",
              description: "Amount of principal that has been repaid",
              example: 0.0,
            },
            status: {
              type: "string",
              enum: ["PENDING", "FUNDING", "FULLY_FUNDED", "ACTIVE", "REPAID"],
              description: "Current loan status",
              example: "PENDING",
            },
            borrowerId: {
              type: "string",
              format: "uuid",
              description: "ID of the borrower who created the loan",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            borrower: {
              $ref: "#/components/schemas/User",
              description: "Borrower user details",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Loan creation timestamp",
              example: "2024-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Loan last update timestamp",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        LoanListing: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Loan unique identifier",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            title: {
              type: "string",
              description: "Loan title or purpose",
              example: "Small Business Expansion",
            },
            description: {
              type: "string",
              description: "Detailed loan description",
              example: "Funding needed to expand our retail operations",
            },
            amountRequested: {
              type: "number",
              format: "decimal",
              description: "Total amount requested for the loan",
              example: 50000.0,
            },
            amountFunded: {
              type: "number",
              format: "decimal",
              description: "Amount that has been funded so far",
              example: 25000.0,
            },
            interestRate: {
              type: "number",
              format: "decimal",
              description: "Annual interest rate as a percentage",
              example: 12.5,
            },
            duration: {
              type: "integer",
              description: "Loan duration in specified units",
              example: 24,
            },
            status: {
              type: "string",
              enum: ["PENDING", "FUNDING", "FULLY_FUNDED", "ACTIVE", "REPAID"],
              description: "Current loan status",
              example: "FUNDING",
            },
            borrower: {
              type: "string",
              description: "Borrower display name",
              example: "John Doe",
            },
            progress: {
              type: "number",
              format: "decimal",
              description: "Funding progress as a percentage (0-100)",
              example: 50.0,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Loan creation timestamp",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        CreateLoanRequest: {
          type: "object",
          required: ["title", "amountRequested", "interestRate", "duration"],
          properties: {
            title: {
              type: "string",
              description: "Loan title or purpose",
              example: "Small Business Expansion",
            },
            description: {
              type: "string",
              description: "Detailed loan description",
              example: "Funding needed to expand our retail operations",
            },
            amountRequested: {
              type: "number",
              format: "decimal",
              minimum: 0.01,
              description: "Amount requested for the loan",
              example: 50000.0,
            },
            interestRate: {
              type: "number",
              format: "decimal",
              minimum: 0,
              maximum: 100,
              description: "Interest rate percentage",
              example: 12.5,
            },
            duration: {
              type: "integer",
              minimum: 1,
              maximum: 1000,
              description:
                "Loan duration value (interpreted based on durationUnit)",
              example: 24,
            },
            durationUnit: {
              type: "string",
              enum: ["DAYS", "WEEKS", "MONTHS", "YEARS"],
              description: "Unit for the duration field",
              example: "MONTHS",
              default: "MONTHS",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
            error: {
              type: "string",
              example: "Detailed error description",
            },
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
            data: {
              type: "object",
              description: "Response data",
            },
          },
        },
        UnifiedDashboard: {
          type: "object",
          properties: {
            // Borrower perspective
            totalApplications: {
              type: "integer",
              description: "Total number of loan applications created by user",
              example: 5,
            },
            pendingApplications: {
              type: "integer",
              description: "Number of pending loan applications",
              example: 2,
            },
            activeLoansAsBorrower: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Loan",
              },
              description: "List of active loans where user is the borrower",
            },
            // Lender perspective
            investmentSummary: {
              type: "object",
              properties: {
                totalInvested: {
                  type: "number",
                  format: "decimal",
                  description: "Total amount invested",
                  example: 100000.0,
                },
                totalEarnings: {
                  type: "number",
                  format: "decimal",
                  description: "Total earnings from investments",
                  example: 12500.0,
                },
                activeInvestments: {
                  type: "integer",
                  description: "Number of active investments",
                  example: 8,
                },
              },
            },
            newListings: {
              type: "array",
              items: {
                $ref: "#/components/schemas/LoanListing",
              },
              description:
                "Recent loan listings available for funding (excluding user's own loans)",
            },
            // Available actions
            availableRoles: {
              type: "array",
              items: {
                type: "string",
                enum: ["BORROWER", "LENDER"],
              },
              description: "Available actions for this user",
              example: ["BORROWER", "LENDER"],
            },
          },
        },
        FundLoanRequest: {
          type: "object",
          required: ["amount"],
          properties: {
            amount: {
              type: "number",
              format: "decimal",
              minimum: 0.01,
              description: "Amount to fund",
              example: 5000.0,
            },
          },
        },
        DepositRequest: {
          type: "object",
          required: ["amount", "reference"],
          properties: {
            amount: {
              type: "number",
              format: "decimal",
              minimum: 0.01,
              description: "Amount to deposit",
              example: 10000.0,
            },
            reference: {
              type: "string",
              description: "Payment reference from payment gateway",
              example: "ref_12345abcde",
            },
          },
        },
        WithdrawalRequest: {
          type: "object",
          required: ["amount", "accountNumber", "bankCode"],
          properties: {
            amount: {
              type: "number",
              format: "decimal",
              minimum: 0.01,
              description: "Amount to withdraw",
              example: 5000.0,
            },
            accountNumber: {
              type: "string",
              description: "Recipient bank account number",
              example: "0123456789",
            },
            bankCode: {
              type: "string",
              description: "Recipient bank code",
              example: "058",
            },
          },
        },
        Bank: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Bank ID",
              example: 1,
            },
            name: {
              type: "string",
              description: "Bank name",
              example: "Guaranty Trust Bank",
            },
            code: {
              type: "string",
              description: "Bank code",
              example: "058",
            },
            longcode: {
              type: "string",
              description: "Bank long code",
              example: "058152036",
            },
            gateway: {
              type: "string",
              description: "Payment gateway",
              example: "emandate",
            },
            pay_with_bank: {
              type: "boolean",
              description: "Can pay with bank",
              example: false,
            },
            active: {
              type: "boolean",
              description: "Bank is active",
              example: true,
            },
            country: {
              type: "string",
              description: "Bank country",
              example: "Nigeria",
            },
            currency: {
              type: "string",
              description: "Bank currency",
              example: "NGN",
            },
            type: {
              type: "string",
              description: "Bank type",
              example: "nuban",
            },
          },
        },
        WebhookEvent: {
          type: "object",
          properties: {
            event: {
              type: "string",
              description: "Webhook event type",
              example: "charge.success",
            },
            data: {
              type: "object",
              description: "Webhook event data",
            },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "User unique identifier",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
              example: "fostogokka@necub.com",
            },
            firstName: {
              type: "string",
              description: "User first name",
              example: "John",
            },
            lastName: {
              type: "string",
              description: "User last name",
              example: "Doe",
            },
            isEmailVerified: {
              type: "boolean",
              description: "Whether the user email is verified",
              example: true,
            },
            availableBalance: {
              type: "number",
              format: "decimal",
              description: "Funds ready for use/withdrawal",
              example: 50000.0,
            },
            escrowBalance: {
              type: "number",
              format: "decimal",
              description: "Funds committed to PENDING/FUNDING loans",
              example: 10000.0,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Transaction unique identifier",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "ID of the user who owns this transaction",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            amount: {
              type: "number",
              format: "decimal",
              description: "Transaction amount",
              example: 10000.0,
            },
            type: {
              type: "string",
              enum: [
                "DEPOSIT",
                "FUNDING_COMMIT",
                "FUNDING_RELEASE",
                "DISBURSEMENT",
                "REPAYMENT",
                "WITHDRAWAL",
              ],
              description: "Type of transaction",
              example: "DEPOSIT",
            },
            description: {
              type: "string",
              nullable: true,
              description: "Transaction description",
              example: "Deposit via Paystack, Ref: ref_123456789",
            },
            externalRef: {
              type: "string",
              nullable: true,
              description: "External transaction reference (may be absent)",
              example: "paystack_ref_123456",
            },
            loanId: {
              type: "string",
              format: "uuid",
              nullable: true,
              description: "Associated loan ID (if applicable)",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            loan: {
              type: "object",
              nullable: true,
              properties: {
                title: {
                  type: "string",
                  description: "Loan title for context",
                  example: "Business Expansion Loan",
                },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Transaction creation timestamp",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Authentication required or token invalid",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        InternalServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [
    // Use project cwd so swagger-jsdoc can locate route source files reliably
    path.join(process.cwd(), "src/routes/*.ts"),
  ],
};
export const specs = swaggerJSDoc(options);

// Safe debug logs - cast to any to avoid TS errors and guard presence of paths
const _specsAny = specs as any;
// Swagger specs generated. Paths info available in _specsAny if needed.
