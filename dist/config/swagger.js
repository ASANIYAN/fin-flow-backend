"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.specs = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "FinFlow API",
            version: "1.0.0",
            description: "A comprehensive financial application API with authentication and user management",
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
                            description: "Loan duration in months",
                            example: 24,
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
                            maximum: 360,
                            description: "Loan duration in months",
                            example: 24,
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
exports.specs = (0, swagger_jsdoc_1.default)(options);
