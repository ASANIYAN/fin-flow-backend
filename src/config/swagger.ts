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
              type: "integer",
              description: "User unique identifier",
              example: 1,
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

export const specs = swaggerJSDoc(options);
