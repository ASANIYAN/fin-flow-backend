"use strict";
// src/controllers/loanController.ts
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
exports.getOpenLoans = exports.fundLoan = exports.createLoan = exports.getDashboardData = void 0;
const loanService_1 = require("../services/loanService");
const message_1 = require("../utils/message");
const getDashboardData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    try {
        if (user.role === "BORROWER") {
            const data = yield (0, loanService_1.getBorrowerDashboardData)(user.id);
            return (0, message_1.successResponse)(res, 200, "Borrower dashboard data fetched successfully", data);
        }
        if (user.role === "LENDER") {
            const data = yield (0, loanService_1.getLenderDashboardData)(user.id);
            return (0, message_1.successResponse)(res, 200, "Lender dashboard data fetched successfully", data);
        }
        return (0, message_1.errorResponse)(res, 403, "Access denied. Invalid user role.");
    }
    catch (error) {
        console.error(error);
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred");
    }
});
exports.getDashboardData = getDashboardData;
const createLoan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { title, description, amountRequested, interestRate, duration } = req.body;
    // Basic validation to ensure required fields are present
    if (!title || !amountRequested || !interestRate || !duration) {
        return (0, message_1.errorResponse)(res, 400, "Missing required loan fields.");
    }
    try {
        const loanData = {
            title,
            description,
            amountRequested,
            interestRate,
            duration,
            borrowerId: user.id, // Attach the authenticated user's ID
        };
        const newLoan = yield (0, loanService_1.createLoanService)(loanData);
        return (0, message_1.successResponse)(res, 201, "Loan application created successfully.", newLoan);
    }
    catch (error) {
        console.error("Error creating loan:", error);
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
});
exports.createLoan = createLoan;
const fundLoan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { amount } = req.body;
    const user = req.user;
    // Basic validation for amount
    if (!amount || typeof amount !== "number" || amount <= 0) {
        return (0, message_1.errorResponse)(res, 400, "Invalid funding amount provided.");
    }
    try {
        yield (0, loanService_1.fundLoanService)(id, user.id, amount);
        return (0, message_1.successResponse)(res, 200, "Loan funded successfully.");
    }
    catch (error) {
        console.error("Error funding loan:", error);
        if (error instanceof Error) {
            return (0, message_1.errorResponse)(res, 400, error.message);
        }
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
});
exports.fundLoan = fundLoan;
const getOpenLoans = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, pageSize, q, minAmount, maxAmount, sortBy } = req.query;
        const pageNumber = parseInt(page) || 1;
        const size = parseInt(pageSize) || 10;
        const min = parseFloat(minAmount);
        const max = parseFloat(maxAmount);
        const query = q;
        const sort = sortBy;
        const { loans, totalCount, totalPages } = yield (0, loanService_1.getOpenLoansService)(pageNumber, size, query, min, max, sort);
        return (0, message_1.successResponse)(res, 200, "Open loan listings fetched successfully.", {
            loans,
            page: pageNumber,
            pageSize: size,
            totalCount,
            totalPages,
        });
    }
    catch (error) {
        console.error("Error fetching open loans:", error);
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
});
exports.getOpenLoans = getOpenLoans;
