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
// Function for a standardized error response
const errorResponse = (res, statusCode, message, errorDetails) => {
    const response = {
        success: false,
        message,
        error: (errorDetails === null || errorDetails === void 0 ? void 0 : errorDetails.toString()) || message,
    };
    return res.status(statusCode).json(response);
};
exports.errorResponse = errorResponse;
