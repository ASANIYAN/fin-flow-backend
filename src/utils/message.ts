import { Response } from "express";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
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

// Function for a standardized error response
export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errorDetails?: any
) => {
  const response: ApiResponse<null> = {
    success: false,
    message,
    error: errorDetails?.toString() || message,
  };
  return res.status(statusCode).json(response);
};
