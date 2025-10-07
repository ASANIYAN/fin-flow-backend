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
// Import Prisma for error handling - use the main client types since they're the same
const message_1 = require("../utils/message");
const emailService_1 = require("../utils/emailService");
const userService_1 = require("../services/userService");
const validation_1 = require("../utils/validation");
const client_1 = require("@prisma/client");
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
        // Unexpected error in sendVerificationEmail
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, confirmPassword, firstName, lastName, role } = req.body;
    // Define validation schema for signup
    const signupValidationSchema = {
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
    if (!(0, validation_1.validateAndRespond)(req.body, signupValidationSchema, res)) {
        return; // Response already sent by validateAndRespond
    }
    // Additional validation for password confirmation
    if (password !== confirmPassword) {
        return (0, message_1.errorResponse)(res, 400, "Passwords do not match", {
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
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002") {
            return (0, message_1.errorResponse)(res, 409, "Email already in use");
        }
        // Unexpected error during signup
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
        // Unexpected error during verifyEmail
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
});
exports.verifyEmail = verifyEmail;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Define validation schema for login
    const loginValidationSchema = {
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
    if (!(0, validation_1.validateAndRespond)(req.body, loginValidationSchema, res)) {
        return; // Response already sent by validateAndRespond
    }
    const { email, password } = req.body;
    try {
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
        // Generate JWT with 24 hour expiry
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" } // Token expires in 24 hours
        );
        // Decode token to extract issued at and expiry
        const decoded = jsonwebtoken_1.default.decode(token);
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
        return (0, message_1.successResponse)(res, 200, "Login successful", {
            token: {
                value: token,
                expiresAt: expireAt,
            },
            user: userData,
        });
    }
    catch (error) {
        // Unexpected error during login
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
        // Unexpected error during forgotPassword
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
        // Unexpected error during resetPassword
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
});
exports.resetPassword = resetPassword;
