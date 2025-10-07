"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawFunds = exports.depositFunds = void 0;
const message_1 = require("../utils/message");
const walletService_1 = require("../services/walletService");
const validation_1 = require("../utils/validation");
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
// The endpoint called by the frontend callback after payment success
const depositFunds = async (req, res) => {
    const user = req.user;
    const { amount, reference } = req.body;
    // Define validation schema for deposit
    const depositValidationSchema = {
        amount: { type: "number", required: true, min: 0.01, max: 1000000 },
        reference: { type: "string", required: true, minLength: 1, maxLength: 100 },
    };
    if (!(0, validation_1.validateAndRespond)(req.body, depositValidationSchema, res)) {
        return;
    }
    try {
        // Call the service to confirm the payment via Paystack's API
        await (0, walletService_1.confirmDepositAttemptService)(user.id, amount, reference);
        // Return a success message, instructing the user to wait for the balance update
        return (0, message_1.successResponse)(res, 200, "Payment confirmed. Balance update will follow shortly via webhook.");
    }
    catch (error) {
        // Error confirming deposit
        // If the check fails (e.g., status is pending, amount mismatch, network error)
        if (error instanceof Error) {
            return (0, message_1.errorResponse)(res, 400, error.message);
        }
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred during confirmation.");
    }
};
exports.depositFunds = depositFunds;
const withdrawFunds = async (req, res) => {
    const user = req.user;
    // Extract all necessary withdrawal details from the request body
    const { amount, accountNumber, bankCode } = req.body;
    // Define validation schema for withdrawal
    const withdrawalValidationSchema = {
        amount: {
            type: "number",
            required: true,
            min: 0.01,
            max: 1000000,
        },
        accountNumber: {
            type: "string",
            required: true,
            minLength: 10,
            maxLength: 20,
        },
        bankCode: {
            type: "string",
            required: true,
            minLength: 3,
            maxLength: 10,
        },
    };
    // Validate request data
    if (!(0, validation_1.validateAndRespond)(req.body, withdrawalValidationSchema, res)) {
        return; // Response already sent by validateAndRespond
    }
    try {
        // Pass the complete withdrawal information to the service
        await (0, walletService_1.withdrawFundsService)(user.id, amount, accountNumber, bankCode);
        return (0, message_1.successResponse)(res, 200, "Funds withdrawn successfully.");
    }
    catch (error) {
        // Error withdrawing funds
        if (error instanceof Error) {
            return (0, message_1.errorResponse)(res, 400, error.message);
        }
        // Handle Axios errors
        if (error && typeof error === "object" && "response" in error) {
            const axiosError = error;
            return (0, message_1.errorResponse)(res, 400, axiosError.response?.data?.message || "External service error");
        }
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
};
exports.withdrawFunds = withdrawFunds;
