"use strict";
// Authentication-related types and interfaces
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthErrorType = void 0;
// Error types for better error handling
var AuthErrorType;
(function (AuthErrorType) {
    AuthErrorType["TOKEN_MISSING"] = "TOKEN_MISSING";
    AuthErrorType["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    AuthErrorType["INVALID_TOKEN"] = "INVALID_TOKEN";
    AuthErrorType["TOKEN_VERIFICATION_FAILED"] = "TOKEN_VERIFICATION_FAILED";
    AuthErrorType["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    AuthErrorType["EMAIL_NOT_VERIFIED"] = "EMAIL_NOT_VERIFIED";
})(AuthErrorType || (exports.AuthErrorType = AuthErrorType = {}));
