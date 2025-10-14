"use strict";
// src/controllers/loanController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFundedLoans = exports.repayLoan = exports.getMyLoans = exports.getOpenLoans = exports.fundLoan = exports.updateLoan = exports.deleteLoan = exports.createLoan = exports.getDashboardData = void 0;
const loanService_1 = require("../services/loanService");
const message_1 = require("../utils/message");
const validation_1 = require("../utils/validation");
const getDashboardData = async (req, res) => {
    const user = req.user;
    try {
        // Get both borrower and lender data for the unified user
        const [borrowerData, lenderData] = await Promise.all([
            (0, loanService_1.getBorrowerDashboardData)(user.id),
            (0, loanService_1.getLenderDashboardData)(user.id),
        ]);
        const unifiedData = {
            // Borrower perspective
            totalApplications: borrowerData.totalApplications,
            pendingApplications: borrowerData.pendingApplications,
            activeLoansAsBorrower: borrowerData.activeLoans,
            // Lender perspective
            investmentSummary: lenderData.investmentSummary,
            newListings: lenderData.newListings,
            // User can act as both
            availableRoles: ["BORROWER", "LENDER"],
        };
        return (0, message_1.successResponse)(res, 200, "Dashboard data fetched successfully", unifiedData);
    }
    catch (error) {
        // Unexpected error
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred");
    }
};
exports.getDashboardData = getDashboardData;
const createLoan = async (req, res) => {
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
        const newLoan = await (0, loanService_1.createLoanService)(loanData);
        return (0, message_1.successResponse)(res, 201, "Loan application created successfully.", newLoan);
    }
    catch (error) {
        // Error creating loan
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
};
exports.createLoan = createLoan;
const deleteLoan = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    try {
        const deletedLoan = await (0, loanService_1.deleteLoanService)(id, user.id);
        return (0, message_1.successResponse)(res, 200, "Loan application deleted successfully.", deletedLoan);
    }
    catch (error) {
        // Error deleting loan
        if (error instanceof Error) {
            if (error.message === "Loan not found.") {
                return (0, message_1.errorResponse)(res, 404, error.message);
            }
            if (error.message === "You can only delete your own loan applications." ||
                error.message.includes("Can only delete loans that are in PENDING status")) {
                return (0, message_1.errorResponse)(res, 400, error.message);
            }
        }
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
        // This catches genuine, unhandled server errors
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
};
exports.deleteLoan = deleteLoan;
const updateLoan = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    const { title, description, amountRequested, interestRate, duration, durationUnit, } = req.body;
    // Define validation schema for loan update (all fields optional)
    const loanUpdateValidationSchema = {
        title: {
            type: "string",
            required: false,
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
            required: false,
            min: 0.01,
            max: 1000000,
        },
        interestRate: {
            type: "number",
            required: false,
            min: 0,
            max: 100,
        },
        duration: {
            type: "number",
            required: false,
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
    if (!(0, validation_1.validateAndRespond)(req.body, loanUpdateValidationSchema, res)) {
        return;
    }
    // 2. Data Preparation (Casting for numeric fields if provided)
    try {
        const updateData = {};
        if (title !== undefined) {
            updateData.title = title;
        }
        if (description !== undefined) {
            updateData.description = description;
        }
        if (amountRequested !== undefined) {
            const numericAmountRequested = parseFloat(amountRequested);
            if (isNaN(numericAmountRequested)) {
                return (0, message_1.errorResponse)(res, 400, "Validation error: Invalid numeric format for amountRequested.", { code: "CASTING_ERROR" });
            }
            updateData.amountRequested = numericAmountRequested;
        }
        if (interestRate !== undefined) {
            const numericInterestRate = parseFloat(interestRate);
            if (isNaN(numericInterestRate)) {
                return (0, message_1.errorResponse)(res, 400, "Validation error: Invalid numeric format for interestRate.", { code: "CASTING_ERROR" });
            }
            updateData.interestRate = numericInterestRate;
        }
        if (duration !== undefined) {
            const integerDuration = parseInt(duration, 10);
            if (isNaN(integerDuration)) {
                return (0, message_1.errorResponse)(res, 400, "Validation error: Invalid numeric format for duration.", { code: "CASTING_ERROR" });
            }
            updateData.duration = integerDuration;
        }
        if (durationUnit !== undefined) {
            updateData.durationUnit = durationUnit;
        }
        // Check if at least one field is being updated
        if (Object.keys(updateData).length === 0) {
            return (0, message_1.errorResponse)(res, 400, "At least one field must be provided for update.");
        }
        const updatedLoan = await (0, loanService_1.updateLoanService)(id, user.id, updateData);
        return (0, message_1.successResponse)(res, 200, "Loan application updated successfully.", updatedLoan);
    }
    catch (error) {
        // Error updating loan
        if (error instanceof Error) {
            if (error.message === "Loan not found.") {
                return (0, message_1.errorResponse)(res, 404, error.message);
            }
            if (error.message === "You can only update your own loan applications." ||
                error.message.includes("Can only update loans that are in PENDING status")) {
                return (0, message_1.errorResponse)(res, 400, error.message);
            }
        }
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
        // This catches genuine, unhandled server errors
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
};
exports.updateLoan = updateLoan;
const fundLoan = async (req, res) => {
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
        await (0, loanService_1.fundLoanService)(id, user.id, amount);
        return (0, message_1.successResponse)(res, 200, "Loan funded successfully.");
    }
    catch (error) {
        // Error funding loan
        if (error instanceof Error) {
            if (error.message === "Loan not found.") {
                return (0, message_1.errorResponse)(res, 404, error.message);
            }
            return (0, message_1.errorResponse)(res, 400, error.message);
        }
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
};
exports.fundLoan = fundLoan;
const getOpenLoans = async (req, res) => {
    const user = req.user;
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
        const { loans, totalCount, totalPages } = await (0, loanService_1.getOpenLoansService)(pageNumber, size, user.id, // userId for self-exclusion
        query, min, max, sort);
        return (0, message_1.successResponse)(res, 200, "Open loan listings fetched successfully.", {
            loans,
            page: pageNumber,
            pageSize: size,
            totalCount,
            totalPages,
        });
    }
    catch (error) {
        // Error fetching open loans
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
};
exports.getOpenLoans = getOpenLoans;
const getMyLoans = async (req, res) => {
    const user = req.user;
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
        const { loans, totalCount, totalPages } = await (0, loanService_1.getAllLoansByBorrower)(user.id, pageNumber, size, query, min, max, st);
        return (0, message_1.successResponse)(res, 200, "User loans fetched successfully.", {
            loans,
            page: pageNumber,
            pageSize: size,
            totalCount,
            totalPages,
        });
    }
    catch (error) {
        // Error fetching user loans
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred.");
    }
};
exports.getMyLoans = getMyLoans;
const repayLoan = async (req, res) => {
    // The borrower ID comes from the authenticated user token
    const user = req.user;
    const loanId = req.params.loanId;
    const { paymentAmount } = req.body;
    // 1. Input Validation: paymentAmount must be provided and be a positive number
    const repaymentSchema = {
        paymentAmount: { type: "number", required: true, min: 0.01 },
    };
    if (!(0, validation_1.validateAndRespond)(req.body, repaymentSchema, res)) {
        return;
    }
    const amount = parseFloat(paymentAmount);
    try {
        // 2. Call the service to process the repayment
        const result = await (0, loanService_1.repayLoanService)(loanId, user.id, amount);
        return (0, message_1.successResponse)(res, 200, "Loan repayment processed successfully.", result);
    }
    catch (error) {
        console.error("Error processing repayment:", error);
        if (error instanceof Error) {
            // 3. Specific Error Handling for Service Constraints
            // 400 Bad Request: Business rule violations (not borrower, wrong status, wrong amount)
            if (error.message.includes("Loan not found") ||
                error.message.includes("User is not the borrower") ||
                error.message.includes("ACTIVE state") ||
                error.message.includes("Repayment amount must be exactly")) {
                return (0, message_1.errorResponse)(res, 400, error.message);
            }
            // 402 Payment Required: Insufficient funds in the user's wallet
            if (error.message.includes("Insufficient available funds")) {
                return (0, message_1.errorResponse)(res, 402, error.message);
            }
        }
        // 500 Internal Server Error for other unexpected issues
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred during repayment processing.");
    }
};
exports.repayLoan = repayLoan;
const getFundedLoans = async (req, res) => {
    const user = req.user;
    const { page, pageSize, q } = req.query;
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
            maxLength: 255,
        },
    };
    // Validate query parameters
    const queryData = { page, pageSize, q };
    if (!(0, validation_1.validateAndRespond)(queryData, queryValidationSchema, res)) {
        return; // Response already sent by validateAndRespond
    }
    // Parse query parameters with default values
    const pageNumber = parseInt(page) || 1;
    const size = parseInt(pageSize) || 10;
    const searchQuery = q;
    try {
        const { loans, totalCount, totalPages } = await (0, loanService_1.getFundedLoansByLenderService)(user.id, pageNumber, size, searchQuery);
        return (0, message_1.successResponse)(res, 200, "Funded loans retrieved successfully", {
            loans,
            page: pageNumber,
            pageSize: size,
            totalCount,
            totalPages,
        });
    }
    catch (error) {
        console.error("Error fetching funded loans:", error);
        // Respond with a 500 status for unexpected server errors
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred while retrieving funded loans");
    }
};
exports.getFundedLoans = getFundedLoans;
