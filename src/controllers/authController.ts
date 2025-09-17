import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { Request, Response } from "express";

import { Prisma, Role } from "../../generated/prisma";
import { successResponse, errorResponse } from "../utils/message";
import {
  comparePasswords,
  createUser,
  findUserByEmail,
  generatePasswordResetToken,
  resetUserPassword,
} from "../services/userService";

interface SignupRequestBody {
  role: Role;
  email: string;
  password: string;
  fullName: string;
  confirmPassword: string;
}

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword, fullName, role } =
      req.body as SignupRequestBody;

    if (!email || !password || !confirmPassword || !fullName || !role) {
      return errorResponse(res, 400, "All fields are required");
    }

    if (password !== confirmPassword) {
      return errorResponse(res, 400, "Passwords do not match");
    }

    if (!Object.values(Role).includes(role)) {
      return errorResponse(res, 400, "Invalid role provided");
    }

    const newUser = await createUser(email, password, fullName, role);

    const userData = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
    };

    return successResponse(res, 201, "User created successfully", userData);
  } catch (error) {
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
      fullName: user.fullName,
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

    // Security best practice: Always send a success response to prevent user enumeration
    if (!resetToken) {
      return successResponse(
        res,
        200,
        "If a user with that email exists, a password reset link has been sent."
      );
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset</p>
        <p>Click this link to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

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
