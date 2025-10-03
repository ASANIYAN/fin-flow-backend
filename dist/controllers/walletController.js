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
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawFunds = exports.depositFunds = void 0;
const message_1 = require("../utils/message");
const walletService_1 = require("../services/walletService");
const validation_1 = require("../utils/validation");
const depositFunds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = req.user;
    const { amount, reference } = req.body;
    // Define validation schema for deposit
    const depositValidationSchema = {
        amount: {
            type: "number",
            required: true,
            min: 0.01,
            max: 1000000,
        },
        reference: {
            type: "string",
            required: true,
            minLength: 1,
            maxLength: 100,
        },
    };
    // Validate request data
    if (!(0, validation_1.validateAndRespond)(req.body, depositValidationSchema, res)) {
        return; // Response already sent by validateAndRespond
    }
    try {
        yield (0, walletService_1.depositFundsService)(user.id, amount, reference);
        return (0, message_1.successResponse)(res, 200, "Wallet funded successfully.");
    }
    catch (error) {
        console.error("Error depositing funds:", error);
        if (error instanceof Error) {
            return (0, message_1.errorResponse)(res, 400, error.message);
        }
        // Handle Axios errors
        if (error && typeof error === "object" && "response" in error) {
            const axiosError = error;
            return (0, message_1.errorResponse)(res, 400, ((_b = (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "External service error");
        }
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
});
exports.depositFunds = depositFunds;
const withdrawFunds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
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
        yield (0, walletService_1.withdrawFundsService)(user.id, amount, accountNumber, bankCode);
        return (0, message_1.successResponse)(res, 200, "Funds withdrawn successfully.");
    }
    catch (error) {
        console.error("Error withdrawing funds:", error);
        if (error instanceof Error) {
            return (0, message_1.errorResponse)(res, 400, error.message);
        }
        // Handle Axios errors
        if (error && typeof error === "object" && "response" in error) {
            const axiosError = error;
            return (0, message_1.errorResponse)(res, 400, ((_b = (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "External service error");
        }
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
});
exports.withdrawFunds = withdrawFunds;
