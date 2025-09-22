"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.login = exports.verifyEmail = exports.signup = exports.sendVerificationEmail = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../generated/prisma");
// Import Prisma for error handling - use the main client types since they're the same
const Prisma = process.env.NODE_ENV === "test"
    ? require("../../generated/prisma-test").Prisma
    : require("../../generated/prisma").Prisma;
const message_1 = require("../utils/message");
const emailService_1 = require("../utils/emailService");
const userService_1 = require("../services/userService");
const sendVerificationEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return (0, message_1.errorResponse)(res, 400, "Email is required");
        }
        const user = yield (0, userService_1.findUserByEmail)(email);
        if (!user) {
            return (0, message_1.errorResponse)(res, 404, "User not found");
        }
        if (user.isEmailVerified) {
            return (0, message_1.errorResponse)(res, 400, "Email is already verified");
        }
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${user.verificationToken}`;
        yield (0, emailService_1.sendEmail)({
            to: user.email,
            subject: "Verify Your Email Address",
            html: `<p>Please verify your email by clicking the following link:</p>
             <a href="${verificationUrl}">Verify Email</a>`,
        });
        return (0, message_1.successResponse)(res, 200, "Verification email sent successfully");
    }
    catch (error) {
        console.error(error);
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, confirmPassword, firstName, lastName, role } = req.body;
        if (!email ||
            !password ||
            !confirmPassword ||
            !firstName ||
            !lastName ||
            !role) {
            return (0, message_1.errorResponse)(res, 400, "All fields are required");
        }
        if (password !== confirmPassword) {
            return (0, message_1.errorResponse)(res, 400, "Passwords do not match");
        }
        if (!Object.values(prisma_1.Role).includes(role)) {
            return (0, message_1.errorResponse)(res, 400, "Invalid role provided");
        }
        const newUser = yield (0, userService_1.createUser)(email, password, firstName, lastName, role);
        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${newUser.verificationToken}`;
        yield (0, emailService_1.sendEmail)({
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
        return (0, message_1.successResponse)(res, 201, "User created successfully", userData);
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002") {
            return (0, message_1.errorResponse)(res, 409, "Email already in use");
        }
        console.error(error);
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
});
exports.signup = signup;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.params;
        const user = yield (0, userService_1.findUserByVerificationToken)(token);
        if (!user) {
            return (0, message_1.errorResponse)(res, 400, "Invalid or expired verification token.");
        }
        yield (0, userService_1.verifyUser)(user.id);
        // Return success response for frontend to handle redirection
        return (0, message_1.successResponse)(res, 200, "Email verified successfully");
    }
    catch (error) {
        console.error(error);
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
});
exports.verifyEmail = verifyEmail;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return (0, message_1.errorResponse)(res, 400, "Email and password are required");
        }
        const user = yield (0, userService_1.findUserByEmail)(email);
        if (!user) {
            return (0, message_1.errorResponse)(res, 401, "Invalid email or password");
        }
        const isMatch = yield (0, userService_1.comparePasswords)(password, user.password);
        if (!isMatch) {
            return (0, message_1.errorResponse)(res, 401, "Invalid email or password");
        }
        // Check if email is verified
        if (!user.isEmailVerified) {
            return (0, message_1.errorResponse)(res, 403, "Please verify your email address before logging in");
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" } // Token expires in 1 hour
        );
        const userData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
        };
        return (0, message_1.successResponse)(res, 200, "Login successful", {
            token,
            user: userData,
        });
    }
    catch (error) {
        console.error(error);
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
});
exports.login = login;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return (0, message_1.errorResponse)(res, 400, "Email is required");
        }
        const resetToken = yield (0, userService_1.generatePasswordResetToken)(email);
        if (!resetToken) {
            return (0, message_1.successResponse)(res, 200, "If a user with that email exists, a password reset link has been sent.");
        }
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
        yield (0, emailService_1.sendEmail)({
            to: email,
            subject: "Password Reset Request",
            html: `
        <p>You requested a password reset</p>
        <p>Click this link to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
        });
        return (0, message_1.successResponse)(res, 200, "If a user with that email exists, a password reset link has been sent.");
    }
    catch (error) {
        console.error(error);
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return (0, message_1.errorResponse)(res, 400, "Token and password are required");
        }
        const updatedUser = yield (0, userService_1.resetUserPassword)(token, newPassword);
        if (!updatedUser) {
            return (0, message_1.errorResponse)(res, 400, "Invalid or expired password reset token.");
        }
        return (0, message_1.successResponse)(res, 200, "Password reset successful.");
    }
    catch (error) {
        console.error(error);
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
});
exports.resetPassword = resetPassword;
