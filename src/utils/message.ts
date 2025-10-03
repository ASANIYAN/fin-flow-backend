import { Response } from "express";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  // keep `error` as a human-readable string for backwards compatibility
  error?: string;
  // structured details for programmatic clients
  errorDetails?: any;
  // compact JSON/string summary to aid debugging
  errorSummary?: string;
}

// Function for a standardized success response
export const successResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

// Helper to safely stringify error details without producing '[object Object]'
const safeErrorSummary = (err: any): string => {
  try {
    if (typeof err === "string") return err;
    if (err === undefined || err === null) return "";
    // If it's an Error instance, prefer its message
    if (err instanceof Error && err.message) return err.message;
    // For objects/arrays, produce a compact JSON string
    return JSON.stringify(err);
  } catch (_e) {
    return String(err);
  }
};

// Function for a standardized error response
export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errorDetails?: any
) => {
  const summary = safeErrorSummary(errorDetails) || message;
  const response: ApiResponse<any> = {
    success: false,
    message,
    data: undefined,
    error: errorDetails,
  };
  return res.status(statusCode).json(response);
};
