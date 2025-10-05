import jwt from "jsonwebtoken";
import { Request, Response } from "express";

import { Role } from "../../generated/prisma";

// Import Prisma for error handling - use the main client types since they're the same
const Prisma =
  process.env.NODE_ENV === "test"
    ? require("../../generated/prisma-test").Prisma
    : require("../../generated/prisma").Prisma;
import { successResponse, errorResponse } from "../utils/message";
import { sendEmail } from "../utils/emailService";
import {
  comparePasswords,
  createUser,
  findUserByEmail,
  findUserByVerificationToken,
  generatePasswordResetToken,
  resetUserPassword,
  verifyUser,
} from "../services/userService";
import { validateAndRespond, ValidationSchema } from "../utils/validation";

interface SignupRequestBody {
  role: Role;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

export const sendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, "Email is required");
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    if (user.isEmailVerified) {
      return errorResponse(res, 400, "Email is already verified");
    }

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${user.verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify Your Email Address",
      html: `<p>Please verify your email by clicking the following link:</p>
             <a href="${verificationUrl}">Verify Email</a>`,
    });

    return successResponse(res, 200, "Verification email sent successfully");
  } catch (error) {
    // Unexpected error in sendVerificationEmail
    return errorResponse(res, 500, "An unexpected error occurred", error);
  }
};

export const signup = async (req: Request, res: Response) => {
  const { email, password, confirmPassword, firstName, lastName, role } =
    req.body;

  // Define validation schema for signup
  const signupValidationSchema: ValidationSchema = {
    email: {
      type: "string",
      required: true,
      minLength: 5,
      maxLength: 255,
    },
    password: {
      type: "string",
      required: true,
      minLength: 8,
      maxLength: 128,
    },
    confirmPassword: {
      type: "string",
      required: true,
      minLength: 8,
      maxLength: 128,
    },
    firstName: {
      type: "string",
      required: true,
      minLength: 1,
      maxLength: 50,
    },
    lastName: {
      type: "string",
      required: true,
      minLength: 1,
      maxLength: 50,
    },
    role: {
      type: "string",
      required: true,
      enum: ["BORROWER", "LENDER"],
    },
  };

  // Validate request data
  if (!validateAndRespond(req.body, signupValidationSchema, res)) {
    return; // Response already sent by validateAndRespond
  }

  // Additional validation for password confirmation
  if (password !== confirmPassword) {
    return errorResponse(res, 400, "Passwords do not match", {
      code: "VALIDATION_ERROR",
      fields: [
        {
          field: "confirmPassword",
          message: "Password confirmation does not match the password",
          expectedType: "string",
          receivedType: "string",
        },
      ],
    });
  }

  try {
    const newUser = await createUser(
      email,
      password,
      firstName,
      lastName,
      role
    );

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${newUser.verificationToken}`;

    await sendEmail({
      to: newUser.email,
      subject: "Verify Your Email Address",
      html: `<p>Please verify your email by clicking the following link:</p>
             <a href="${verificationUrl}">Verify Email</a>`,
    });

    const userData = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      isEmailVerified: newUser.isEmailVerified,
      role: newUser.role,
    };

    return successResponse(res, 201, "User created successfully", userData);
  } catch (error: any) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(res, 409, "Email already in use");
    }

    // Unexpected error during signup
    return errorResponse(res, 500, "An unexpected error occurred", error);
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const user = await findUserByVerificationToken(token);

    if (!user) {
      return errorResponse(res, 400, "Invalid or expired verification token.");
    }

    await verifyUser(user.id);

    // Return success response for frontend to handle redirection
    return successResponse(res, 200, "Email verified successfully");
  } catch (error) {
    // Unexpected error during verifyEmail
    return errorResponse(res, 500, "An unexpected error occurred", error);
  }
};

interface LoginRequestBody {
  email: string;
  password: string;
}

export const login = async (req: Request, res: Response) => {
  // Define validation schema for login
  const loginValidationSchema: ValidationSchema = {
    email: {
      type: "string",
      required: true,
      minLength: 5,
      maxLength: 255,
    },
    password: {
      type: "string",
      required: true,
      minLength: 1,
    },
  };

  // Validate request data
  if (!validateAndRespond(req.body, loginValidationSchema, res)) {
    return; // Response already sent by validateAndRespond
  }

  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    const isMatch = await comparePasswords(password, user.password);

    if (!isMatch) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return errorResponse(
        res,
        403,
        "Please verify your email address before logging in"
      );
    }

    // Generate JWT with 24 hour expiry
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" } // Token expires in 24 hours
    );

    // Decode token to extract issued at and expiry
    const decoded = jwt.decode(token) as { [key: string]: any } | null;
    const tokenData = decoded || {};
    // Compute expireAt from token 'exp' claim if present, otherwise fallback to 24h from now
    const expireAt = tokenData.exp
      ? new Date(tokenData.exp * 1000).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };

    return successResponse(res, 200, "Login successful", {
      token: {
        value: token,
        expiresAt: expireAt,
      },
      user: userData,
    });
  } catch (error) {
    // Unexpected error during login
    return errorResponse(res, 500, "An unexpected error occurred", error);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, "Email is required");
    }

    const resetToken = await generatePasswordResetToken(email);

    if (!resetToken) {
      return successResponse(
        res,
        200,
        "If a user with that email exists, a password reset link has been sent."
      );
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset</p>
        <p>Click this link to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    return successResponse(
      res,
      200,
      "If a user with that email exists, a password reset link has been sent."
    );
  } catch (error) {
    // Unexpected error during forgotPassword
    return errorResponse(res, 500, "An unexpected error occurred", error);
  }
};

interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body as ResetPasswordBody;

    if (!token || !newPassword) {
      return errorResponse(res, 400, "Token and password are required");
    }

    const updatedUser = await resetUserPassword(token, newPassword);

    if (!updatedUser) {
      return errorResponse(
        res,
        400,
        "Invalid or expired password reset token."
      );
    }

    return successResponse(res, 200, "Password reset successful.");
  } catch (error) {
    // Unexpected error during resetPassword
    return errorResponse(res, 500, "An unexpected error occurred", error);
  }
};
