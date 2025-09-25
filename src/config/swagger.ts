import swaggerJSDoc, { Options } from "swagger-jsdoc";

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
        url: "https://api.finflow.com",
        description: "Production server",
      },
    ],
    components: {
      schemas: {
        User: {
          type: "object",
          required: ["id", "email", "firstName", "lastName", "role"],
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
              example: "user@example.com",
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
            role: {
              type: "string",
              enum: ["BORROWER", "LENDER"],
              description: "User role in the platform",
              example: "BORROWER",
            },
            isEmailVerified: {
              type: "boolean",
              description: "Whether the user email is verified",
              example: false,
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
            "role",
          ],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User email address",
              example: "user@example.com",
            },
            password: {
              type: "string",
              minLength: 8,
              description: "User password (minimum 8 characters)",
              example: "Password123!",
            },
            confirmPassword: {
              type: "string",
              description: "Password confirmation (must match password)",
              example: "Password123!",
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
            role: {
              type: "string",
              enum: ["BORROWER", "LENDER"],
              description: "User role in the platform",
              example: "BORROWER",
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
              example: "user@example.com",
            },
            password: {
              type: "string",
              description: "User password",
              example: "Password123!",
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
              example: "user@example.com",
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
              example: "NewPassword123!",
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
                  type: "string",
                  description: "JWT authentication token",
                  example: "",
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
            status: {
              type: "string",
              enum: ["PENDING", "FUNDING", "FUNDED", "COMPLETED", "CANCELLED"],
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
        BorrowerDashboard: {
          type: "object",
          properties: {
            totalApplications: {
              type: "integer",
              description: "Total number of loan applications",
              example: 5,
            },
            pendingApplications: {
              type: "integer",
              description: "Number of pending applications",
              example: 2,
            },
            activeLoans: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Loan",
              },
              description: "List of active loans",
            },
          },
        },
        LenderDashboard: {
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
            recentListings: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Loan",
              },
              description: "Recent loan listings available for funding",
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
              example: "user@example.com",
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
            role: {
              type: "string",
              enum: ["BORROWER", "LENDER"],
              description: "User role in the platform",
              example: "BORROWER",
            },
            isEmailVerified: {
              type: "boolean",
              description: "Whether the user email is verified",
              example: true,
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
              enum: ["DEPOSIT", "WITHDRAWAL", "LOAN_FUNDING", "LOAN_REPAYMENT"],
              description: "Type of transaction",
              example: "DEPOSIT",
            },
            status: {
              type: "string",
              enum: ["PENDING", "COMPLETED", "FAILED"],
              description: "Transaction status",
              example: "COMPLETED",
            },
            description: {
              type: "string",
              description: "Transaction description",
              example: "Deposit via Paystack, Ref: ref_123456789",
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
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Transaction last update timestamp",
              example: "2024-01-01T00:00:00.000Z",
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
    __dirname + "/../routes/*.ts", // Current working path for routes
  ],
};

export const specs = swaggerJSDoc(options);
