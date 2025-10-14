"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
// Function for a standardized success response
const successResponse = (res, statusCode, message, data) => {
    const response = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(response);
};
exports.successResponse = successResponse;
// Helper to safely stringify error details without producing '[object Object]'
const safeErrorSummary = (err) => {
    try {
        if (typeof err === "string")
            return err;
        if (err === undefined || err === null)
            return "";
        // If it's an Error instance, prefer its message
        if (err instanceof Error && err.message)
            return err.message;
        // For objects/arrays, produce a compact JSON string
        return JSON.stringify(err);
    }
    catch (_e) {
        return String(err);
    }
};
// Function for a standardized error response
const errorResponse = (res, statusCode, message, errorDetails) => {
    const summary = safeErrorSummary(errorDetails) || message;
    const response = {
        success: false,
        message,
        data: undefined,
        error: errorDetails,
    };
    return res.status(statusCode).json(response);
};
exports.errorResponse = errorResponse;
