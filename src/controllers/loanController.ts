// src/controllers/loanController.ts

import { Request, Response } from "express";
import {
  createLoanService,
  fundLoanService,
  getBorrowerDashboardData,
  getLenderDashboardData,
  getOpenLoansService,
} from "../services/loanService";
import { errorResponse, successResponse } from "../utils/message";
import { AuthenticatedRequest } from "../types/auth";

export const getDashboardData = async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  try {
    if (user.role === "BORROWER") {
      const data = await getBorrowerDashboardData(user.id);
      return successResponse(
        res,
        200,
        "Borrower dashboard data fetched successfully",
        data
      );
    }

    if (user.role === "LENDER") {
      const data = await getLenderDashboardData(user.id);
      return successResponse(
        res,
        200,
        "Lender dashboard data fetched successfully",
        data
      );
    }

    return errorResponse(res, 403, "Access denied. Invalid user role.");
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, "An unexpected error occurred");
  }
};

export const createLoan = async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const {
    title,
    description,
    amountRequested,
    interestRate,
    duration,
    durationUnit,
  } = req.body;

  // Basic validation to ensure required fields are present
  if (!title || !amountRequested || !interestRate || !duration) {
    return errorResponse(res, 400, "Missing required loan fields.");
  }

  // Validate durationUnit if provided (defaults to MONTHS in schema if not provided)
  const validDurationUnits = ["DAYS", "WEEKS", "MONTHS", "YEARS"];
  if (durationUnit && !validDurationUnits.includes(durationUnit)) {
    return errorResponse(
      res,
      400,
      "Invalid duration unit. Must be one of: DAYS, WEEKS, MONTHS, YEARS"
    );
  }

  try {
    const loanData = {
      title,
      description,
      amountRequested,
      interestRate,
      duration,
      durationUnit: durationUnit || "MONTHS", // Default to MONTHS if not provided
      borrowerId: user.id, // Attach the authenticated user's ID
    };

    const newLoan = await createLoanService(loanData);

    return successResponse(
      res,
      201,
      "Loan application created successfully.",
      newLoan
    );
  } catch (error) {
    console.error("Error creating loan:", error);
    return errorResponse(res, 500, "An unexpected error occurred.");
  }
};

export const fundLoan = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;
  const user = (req as AuthenticatedRequest).user;

  // Basic validation for amount
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return errorResponse(res, 400, "Invalid funding amount provided.");
  }

  try {
    await fundLoanService(id, user.id, amount);

    return successResponse(res, 200, "Loan funded successfully.");
  } catch (error) {
    console.error("Error funding loan:", error);
    if (error instanceof Error) {
      if (error.message === "Loan not found.") {
        return errorResponse(res, 404, error.message);
      }
      return errorResponse(res, 400, error.message);
    }
    return errorResponse(res, 500, "An unexpected error occurred.");
  }
};

export const getOpenLoans = async (req: Request, res: Response) => {
  try {
    const { page, pageSize, q, minAmount, maxAmount, sortBy } = req.query;

    const pageNumber = parseInt(page as string) || 1;
    const size = parseInt(pageSize as string) || 10;
    const min = parseFloat(minAmount as string);
    const max = parseFloat(maxAmount as string);
    const query = q as string;
    const sort = sortBy as string;

    const { loans, totalCount, totalPages } = await getOpenLoansService(
      pageNumber,
      size,
      query,
      min,
      max,
      sort
    );

    return successResponse(
      res,
      200,
      "Open loan listings fetched successfully.",
      {
        loans,
        page: pageNumber,
        pageSize: size,
        totalCount,
        totalPages,
      }
    );
  } catch (error) {
    console.error("Error fetching open loans:", error);
    return errorResponse(res, 500, "An unexpected error occurred.");
  }
};
