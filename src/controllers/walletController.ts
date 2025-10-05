import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/message";
import { AuthenticatedRequest } from "../types/auth";
import {
  confirmDepositAttemptService,
  withdrawFundsService,
} from "../services/walletService";
import { validateAndRespond, ValidationSchema } from "../utils/validation";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY as string;

// The endpoint called by the frontend callback after payment success
export const depositFunds = async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const { amount, reference } = req.body;

  // Define validation schema for deposit
  const depositValidationSchema: ValidationSchema = {
    amount: { type: "number", required: true, min: 0.01, max: 1000000 },
    reference: { type: "string", required: true, minLength: 1, maxLength: 100 },
  };

  if (!validateAndRespond(req.body, depositValidationSchema, res)) {
    return;
  }

  try {
    // Call the service to confirm the payment via Paystack's API
    await confirmDepositAttemptService(user.id, amount, reference);

    // Return a success message, instructing the user to wait for the balance update
    return successResponse(
      res,
      200,
      "Payment confirmed. Balance update will follow shortly via webhook."
    );
  } catch (error) {
    // Error confirming deposit
    // If the check fails (e.g., status is pending, amount mismatch, network error)
    if (error instanceof Error) {
      return errorResponse(res, 400, error.message);
    }
    return errorResponse(
      res,
      500,
      "An unexpected error occurred during confirmation."
    );
  }
};

export const withdrawFunds = async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  // Extract all necessary withdrawal details from the request body
  const { amount, accountNumber, bankCode } = req.body;

  // Define validation schema for withdrawal
  const withdrawalValidationSchema: ValidationSchema = {
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
  if (!validateAndRespond(req.body, withdrawalValidationSchema, res)) {
    return; // Response already sent by validateAndRespond
  }

  try {
    // Pass the complete withdrawal information to the service
    await withdrawFundsService(user.id, amount, accountNumber, bankCode);
    return successResponse(res, 200, "Funds withdrawn successfully.");
  } catch (error) {
    // Error withdrawing funds
    if (error instanceof Error) {
      return errorResponse(res, 400, error.message);
    }
    // Handle Axios errors
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as any;
      return errorResponse(
        res,
        400,
        axiosError.response?.data?.message || "External service error"
      );
    }
    return errorResponse(res, 500, "An unexpected error occurred.");
  }
};
