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
exports.getMyLoans = exports.getOpenLoans = exports.fundLoan = exports.createLoan = exports.getDashboardData = void 0;
const loanService_1 = require("../services/loanService");
const message_1 = require("../utils/message");
const validation_1 = require("../utils/validation");
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
    // Destructure initial values (they will be strings from req.body)
    const { title, description, amountRequested, interestRate, duration, durationUnit, } = req.body;
    // Define validation schema for loan creation
    const loanValidationSchema = {
        title: {
            type: "string",
            required: true,
            minLength: 1,
            maxLength: 100,
        },
        description: {
            type: "string",
            required: false,
            maxLength: 500,
        },
        amountRequested: {
            type: "number",
            required: true,
            min: 0.01,
            max: 1000000,
        },
        interestRate: {
            type: "number",
            required: true,
            min: 0,
            max: 100,
        },
        duration: {
            type: "number",
            required: true,
            min: 1,
            max: 1000,
        },
        durationUnit: {
            type: "string",
            required: false,
            enum: ["DAYS", "WEEKS", "MONTHS", "YEARS"],
        },
    };
    // 1. Validate request data
    // If validation fails, validateAndRespond sends the 400 error response
    // and returns false. The 'return;' stops execution here.
    if (!(0, validation_1.validateAndRespond)(req.body, loanValidationSchema, res)) {
        return;
    }
    // 2. Data Preparation (Casting)
    try {
        // FIX: Explicitly cast the string values from req.body to their correct numeric types
        // This prevents the internal database error (which would result in a 500)
        const numericAmountRequested = parseFloat(amountRequested);
        const numericInterestRate = parseFloat(interestRate);
        const integerDuration = parseInt(duration, 10);
        // Safety check (redundant after robust validation, but good practice)
        if (isNaN(numericAmountRequested) ||
            isNaN(numericInterestRate) ||
            isNaN(integerDuration)) {
            // This should not happen if validation passed, but acts as a final safeguard
            return (0, message_1.errorResponse)(res, 400, "Validation error: Invalid numeric format after casting.", { code: "CASTING_ERROR" });
        }
        const loanData = {
            title,
            description,
            amountRequested: numericAmountRequested, // Use parsed number
            interestRate: numericInterestRate, // Use parsed number
            duration: integerDuration, // Use parsed integer
            durationUnit: durationUnit || "MONTHS", // Default to MONTHS if not provided
            borrowerId: user.id, // Attach the authenticated user's ID
        };
        const newLoan = yield (0, loanService_1.createLoanService)(loanData);
        return (0, message_1.successResponse)(res, 201, "Loan application created successfully.", newLoan);
    }
    catch (error) {
        console.error("Error creating loan:", error);
        // Handle custom validation errors from service
        if (error && typeof error === "object" && "code" in error) {
            const customError = error;
            if (customError.code === "BAD_REQUEST") {
                return (0, message_1.errorResponse)(res, 400, customError.message, {
                    code: customError.code,
                    details: customError.details,
                });
            }
        }
        // This catches genuine, unhandled server errors (e.g., database connection down)
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
});
exports.createLoan = createLoan;
const fundLoan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { amount } = req.body;
    const user = req.user;
    // Define validation schema for loan funding
    const fundingValidationSchema = {
        amount: {
            type: "number",
            required: true,
            min: 0.01,
        },
    };
    // Validate request data
    if (!(0, validation_1.validateAndRespond)({ amount }, fundingValidationSchema, res)) {
        return; // Response already sent by validateAndRespond
    }
    try {
        yield (0, loanService_1.fundLoanService)(id, user.id, amount);
        return (0, message_1.successResponse)(res, 200, "Loan funded successfully.");
    }
    catch (error) {
        console.error("Error funding loan:", error);
        if (error instanceof Error) {
            if (error.message === "Loan not found.") {
                return (0, message_1.errorResponse)(res, 404, error.message);
            }
            return (0, message_1.errorResponse)(res, 400, error.message);
        }
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
});
exports.fundLoan = fundLoan;
const getOpenLoans = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, pageSize, q, minAmount, maxAmount, sortBy } = req.query;
    // Define validation schema for query parameters
    const queryValidationSchema = {
        page: {
            type: "number",
            required: false,
            min: 1,
        },
        pageSize: {
            type: "number",
            required: false,
            min: 1,
            max: 100,
        },
        q: {
            type: "string",
            required: false,
            maxLength: 100,
        },
        minAmount: {
            type: "number",
            required: false,
            min: 0,
        },
        maxAmount: {
            type: "number",
            required: false,
            min: 0,
        },
        sortBy: {
            type: "string",
            required: false,
            enum: [
                "createdAt_asc",
                "createdAt_desc",
                "amountRequested_asc",
                "amountRequested_desc",
                "interestRate_asc",
                "interestRate_desc",
            ],
        },
    };
    // Convert query parameters to appropriate types for validation
    const queryData = {
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
        q: q,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        sortBy: sortBy,
    };
    // Validate query parameters
    if (!(0, validation_1.validateAndRespond)(queryData, queryValidationSchema, res)) {
        return; // Response already sent by validateAndRespond
    }
    try {
        const pageNumber = queryData.page || 1;
        const size = queryData.pageSize || 10;
        const query = queryData.q;
        const min = queryData.minAmount;
        const max = queryData.maxAmount;
        // Normalize and validate sortBy: accept either plain field names (e.g. "createdAt")
        // or full directioned values (e.g. "createdAt_desc"). If a plain field is
        // provided we default to descending order.
        const allowedFields = ["createdAt", "amountRequested", "interestRate"];
        let sort = undefined;
        if (queryData.sortBy) {
            const rawSort = String(queryData.sortBy).trim();
            if (allowedFields.includes(rawSort)) {
                // default ordering for plain fields
                sort = `${rawSort}_desc`;
            }
            else {
                const m = rawSort.match(/^(.+)_(asc|desc)$/i);
                if (m) {
                    const field = m[1];
                    const dir = m[2].toLowerCase();
                    if (allowedFields.includes(field) &&
                        (dir === "asc" || dir === "desc")) {
                        sort = `${field}_${dir}`;
                    }
                }
            }
            if (!sort) {
                // Return the same message shape used elsewhere for validation errors
                return (0, message_1.errorResponse)(res, 400, "Validation failed for fields: sortBy. sortBy must be one of: createdAt_asc, createdAt_desc, amountRequested_asc, amountRequested_desc, interestRate_asc, interestRate_desc", {
                    code: "VALIDATION_ERROR",
                    fields: [
                        {
                            field: "sortBy",
                            message: "sortBy must be one of: createdAt_asc, createdAt_desc, amountRequested_asc, amountRequested_desc, interestRate_asc, interestRate_desc",
                            expectedType: "string",
                            receivedType: typeof queryData.sortBy,
                        },
                    ],
                });
            }
        }
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
const getMyLoans = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    // Only borrowers can fetch their loans
    if (user.role !== "BORROWER") {
        return (0, message_1.errorResponse)(res, 403, "Access denied. Only borrowers can view their loans.");
    }
    const { page, pageSize, q, minAmount, maxAmount, status } = req.query;
    // Validation schema for query parameters
    const queryValidationSchema = {
        page: { type: "number", required: false, min: 1 },
        pageSize: { type: "number", required: false, min: 1, max: 100 },
        q: { type: "string", required: false, maxLength: 100 },
        minAmount: { type: "number", required: false, min: 0 },
        maxAmount: { type: "number", required: false, min: 0 },
        status: {
            type: "string",
            required: false,
            enum: ["PENDING", "FUNDING", "FUNDED", "REPAID"],
        },
    };
    const queryData = {
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
        q: q,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        status: status,
    };
    if (!(0, validation_1.validateAndRespond)(queryData, queryValidationSchema, res)) {
        return;
    }
    try {
        const pageNumber = queryData.page || 1;
        const size = queryData.pageSize || 10;
        const query = queryData.q;
        const min = queryData.minAmount;
        const max = queryData.maxAmount;
        const st = queryData.status;
        const { loans, totalCount, totalPages } = yield (0, loanService_1.getAllLoansByBorrower)(user.id, pageNumber, size, query, min, max, st);
        return (0, message_1.successResponse)(res, 200, "User loans fetched successfully.", {
            loans,
            page: pageNumber,
            pageSize: size,
            totalCount,
            totalPages,
        });
    }
    catch (error) {
        console.error("Error fetching user loans:", error);
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
});
exports.getMyLoans = getMyLoans;
