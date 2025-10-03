"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndRespond = exports.validateDataTypes = void 0;
const message_1 = require("./message");
/**
 * Validates request data against a schema and returns detailed error messages
 * @param data - The data object to validate
 * @param schema - The validation schema defining expected types and rules
 * @param res - Express response object (optional, for direct error response)
 * @returns Array of validation errors, or sends error response if res is provided
 */
const validateDataTypes = (data, schema, res) => {
    const errors = [];
    // Check each field in the schema
    for (const [field, rule] of Object.entries(schema)) {
        const value = data[field];
        const valueType = Array.isArray(value) ? "array" : typeof value;
        // Check if required field is missing
        if (rule.required &&
            (value === undefined || value === null || value === "")) {
            errors.push({
                field,
                expectedType: rule.type,
                receivedType: "undefined/null/empty",
                value,
                message: `${field} is required and cannot be empty`,
            });
            continue;
        }
        // Skip validation if field is not required and not provided
        if (!rule.required && (value === undefined || value === null)) {
            continue;
        }
        // Additional validations based on type
        switch (rule.type) {
            case "string":
                // Allow string values and values that can be converted to strings
                if (value !== undefined && value !== null) {
                    const stringValue = String(value);
                    if (rule.minLength && stringValue.length < rule.minLength) {
                        errors.push({
                            field,
                            expectedType: rule.type,
                            receivedType: valueType,
                            value,
                            message: `${field} must be at least ${rule.minLength} characters long`,
                        });
                    }
                    if (rule.maxLength && stringValue.length > rule.maxLength) {
                        errors.push({
                            field,
                            expectedType: rule.type,
                            receivedType: valueType,
                            value,
                            message: `${field} must not exceed ${rule.maxLength} characters`,
                        });
                    }
                    if (rule.enum && !rule.enum.includes(stringValue)) {
                        errors.push({
                            field,
                            expectedType: rule.type,
                            receivedType: valueType,
                            value,
                            message: `${field} must be one of: ${rule.enum.join(", ")}`,
                        });
                    }
                }
                else if (rule.required) {
                    errors.push({
                        field,
                        expectedType: rule.type,
                        receivedType: valueType,
                        value,
                        message: `${field} is required and cannot be empty`,
                    });
                }
                break;
            case "number":
                // Allow string inputs that can be parsed to numbers (for query params)
                let numericValue;
                if (typeof value === "string") {
                    if (value.trim() === "") {
                        // Empty string for optional field - skip validation
                        if (!rule.required) {
                            break;
                        }
                        errors.push({
                            field,
                            expectedType: rule.type,
                            receivedType: valueType,
                            value,
                            message: `${field} is required and cannot be empty`,
                        });
                        break;
                    }
                    const parsed = parseFloat(value);
                    if (isNaN(parsed)) {
                        // Invalid number string for optional field - skip validation
                        if (!rule.required) {
                            break;
                        }
                        errors.push({
                            field,
                            expectedType: rule.type,
                            receivedType: valueType,
                            value,
                            message: `${field} must be a valid number`,
                        });
                        break;
                    }
                    numericValue = parsed;
                }
                else if (typeof value === "number" && !isNaN(value)) {
                    numericValue = value;
                }
                else {
                    // Invalid type for optional field - skip validation
                    if (!rule.required) {
                        break;
                    }
                    errors.push({
                        field,
                        expectedType: rule.type,
                        receivedType: valueType,
                        value,
                        message: `${field} must be a valid number`,
                    });
                    break;
                }
                if (rule.min !== undefined && numericValue < rule.min) {
                    errors.push({
                        field,
                        expectedType: rule.type,
                        receivedType: valueType,
                        value,
                        message: `${field} must be at least ${rule.min}`,
                    });
                }
                if (rule.max !== undefined && numericValue > rule.max) {
                    errors.push({
                        field,
                        expectedType: rule.type,
                        receivedType: valueType,
                        value,
                        message: `${field} must not exceed ${rule.max}`,
                    });
                }
                break;
            case "array":
                if (Array.isArray(value)) {
                    if (rule.minLength && value.length < rule.minLength) {
                        errors.push({
                            field,
                            expectedType: rule.type,
                            receivedType: valueType,
                            value,
                            message: `${field} must contain at least ${rule.minLength} items`,
                        });
                    }
                    if (rule.maxLength && value.length > rule.maxLength) {
                        errors.push({
                            field,
                            expectedType: rule.type,
                            receivedType: valueType,
                            value,
                            message: `${field} must not contain more than ${rule.maxLength} items`,
                        });
                    }
                }
                break;
        }
    }
    // If response object is provided and there are errors, send error response
    if (res && errors.length > 0) {
        const errorMessages = errors.map((err) => err.message);
        const fields = errors.map((err) => err.field);
        (0, message_1.errorResponse)(res, 400, `Validation failed for fields: ${fields.join(", ")}. ${errorMessages.join(". ")}`, {
            code: "VALIDATION_ERROR",
            fields: errors.map((err) => ({
                field: err.field,
                message: err.message,
                expectedType: err.expectedType,
                receivedType: err.receivedType,
            })),
        });
        return null;
    }
    return errors.length > 0 ? errors : null;
};
exports.validateDataTypes = validateDataTypes;
/**
 * Convenience function that validates and sends error response if validation fails
 * @param data - The data object to validate
 * @param schema - The validation schema
 * @param res - Express response object
 * @returns true if validation passes, false if it fails (response already sent)
 */
const validateAndRespond = (data, schema, res) => {
    const errors = (0, exports.validateDataTypes)(data, schema);
    if (errors && errors.length > 0) {
        (0, exports.validateDataTypes)(data, schema, res);
        return false;
    }
    return true;
};
exports.validateAndRespond = validateAndRespond;
