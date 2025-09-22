import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/message";
import { AuthenticatedRequest } from "../types/auth";
import {
  depositFundsService,
  withdrawFundsService,
} from "../services/walletService";

export const depositFunds = async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const { amount, reference } = req.body;

  if (!amount || !reference || typeof amount !== "number" || amount <= 0) {
    return errorResponse(res, 400, "Invalid amount or transaction reference.");
  }

  try {
    await depositFundsService(user.id, amount, reference);
    return successResponse(res, 200, "Wallet funded successfully.");
  } catch (error) {
    console.error("Error depositing funds:", error);
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

export const withdrawFunds = async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  // Extract all necessary withdrawal details from the request body
  const { amount, accountNumber, bankCode } = req.body;

  if (
    !amount ||
    typeof amount !== "number" ||
    amount <= 0 ||
    !accountNumber ||
    !bankCode
  ) {
    return errorResponse(res, 400, "Invalid or missing withdrawal details.");
  }

  try {
    // Pass the complete withdrawal information to the service
    await withdrawFundsService(user.id, amount, accountNumber, bankCode);
    return successResponse(res, 200, "Funds withdrawn successfully.");
  } catch (error) {
    console.error("Error withdrawing funds:", error);
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
