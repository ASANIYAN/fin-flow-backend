import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { Request, Response } from "express";
import nodemailerSendgrid from "nodemailer-sendgrid";

import { Role } from "../../generated/prisma";

// Import Prisma for error handling - use the main client types since they're the same
const Prisma =
  process.env.NODE_ENV === "test"
    ? require("../../generated/prisma-test").Prisma
    : require("../../generated/prisma").Prisma;
import { successResponse, errorResponse } from "../utils/message";
import {
  comparePasswords,
  createUser,
  findUserByEmail,
  findUserByVerificationToken,
  generatePasswordResetToken,
  resetUserPassword,
  verifyUser,
} from "../services/userService";

interface SignupRequestBody {
  role: Role;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword, firstName, lastName, role } =
      req.body as SignupRequestBody;

    if (
      !email ||
      !password ||
      !confirmPassword ||
      !firstName ||
      !lastName ||
      !role
    ) {
      return errorResponse(res, 400, "All fields are required");
    }

    if (password !== confirmPassword) {
      return errorResponse(res, 400, "Passwords do not match");
    }

    if (!Object.values(Role).includes(role)) {
      return errorResponse(res, 400, "Invalid role provided");
    }

    const newUser = await createUser(
      email,
      password,
      firstName,
      lastName,
      role
    );

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${newUser.verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER as string,
      to: newUser.email,
      subject: "Verify Your Email Address",
      html: `<p>Please verify your email by clicking the following link:</p>
             <a href="${verificationUrl}">Verify Email</a>`,
    };

    // Use your email transporter logic (SendGrid fallback)
    try {
      const sendgridTransporter = nodemailer.createTransport(
        nodemailerSendgrid({ apiKey: process.env.SENDGRID_API_KEY as string })
      );
      await sendgridTransporter.sendMail(mailOptions);
    } catch (sendgridError) {
      console.error("SendGrid failed, falling back:", sendgridError);
      const fallbackTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      await fallbackTransporter.sendMail(mailOptions);
    }

    const userData = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
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

    console.error(error);
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
    console.error(error);
    return errorResponse(res, 500, "An unexpected error occurred", error);
  }
};

interface LoginRequestBody {
  email: string;
  password: string;
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequestBody;

    if (!email || !password) {
      return errorResponse(res, 400, "Email and password are required");
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    const isMatch = await comparePasswords(password, user.password);

    if (!isMatch) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    return successResponse(res, 200, "Login successful", {
      token,
      user: userData,
    });
  } catch (error) {
    console.error(error);
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

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const personalEmail = process.env.EMAIL_USER as string;

    const mailOptions = {
      from: personalEmail,
      replyTo: personalEmail,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset</p>
        <p>Click this link to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    // --- Primary Email Service (SendGrid) ---
    try {
      const sendgridTransporter = nodemailer.createTransport(
        nodemailerSendgrid({
          apiKey: process.env.SENDGRID_API_KEY as string,
        })
      );
      await sendgridTransporter.sendMail(mailOptions);
    } catch (sendgridError) {
      console.error(
        "SendGrid failed, falling back to Nodemailer/Gmail:",
        sendgridError
      );

      // --- Fallback Email Service (Nodemailer/Gmail) ---
      const fallbackTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: personalEmail,
          pass: process.env.EMAIL_PASS,
        },
      });
      await fallbackTransporter.sendMail(mailOptions);
    }

    return successResponse(
      res,
      200,
      "If a user with that email exists, a password reset link has been sent."
    );
  } catch (error) {
    console.error(error);
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
    console.error(error);
    return errorResponse(res, 500, "An unexpected error occurred", error);
  }
};
