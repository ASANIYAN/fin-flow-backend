// src/controllers/loanController.ts

import { Request, Response } from "express";
import {
  createLoanService,
  fundLoanService,
  getBorrowerDashboardData,
  getLenderDashboardData,
  getOpenLoansService,
  getAllLoansByBorrower,
} from "../services/loanService";
import { errorResponse, successResponse } from "../utils/message";
import { AuthenticatedRequest } from "../types/auth";
import { validateAndRespond, ValidationSchema } from "../utils/validation";

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
    // Unexpected error
    return errorResponse(res, 500, "An unexpected error occurred");
  }
};
export const createLoan = async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  // Destructure initial values (they will be strings from req.body)
  const {
    title,
    description,
    amountRequested,
    interestRate,
    duration,
    durationUnit,
  } = req.body;

  // Define validation schema for loan creation
  const loanValidationSchema: ValidationSchema = {
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
  if (!validateAndRespond(req.body, loanValidationSchema, res)) {
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
    if (
      isNaN(numericAmountRequested) ||
      isNaN(numericInterestRate) ||
      isNaN(integerDuration)
    ) {
      // This should not happen if validation passed, but acts as a final safeguard
      return errorResponse(
        res,
        400,
        "Validation error: Invalid numeric format after casting.",
        { code: "CASTING_ERROR" }
      );
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

    const newLoan = await createLoanService(loanData);

    return successResponse(
      res,
      201,
      "Loan application created successfully.",
      newLoan
    );
  } catch (error) {
    // Error creating loan
    // Handle custom validation errors from service
    if (error && typeof error === "object" && "code" in error) {
      const customError = error as any;
      if (customError.code === "BAD_REQUEST") {
        return errorResponse(res, 400, customError.message, {
          code: customError.code,
          details: customError.details,
        });
      }
    }

    // This catches genuine, unhandled server errors (e.g., database connection down)
    return errorResponse(res, 500, "An unexpected error occurred.");
  }
};

export const fundLoan = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;
  const user = (req as AuthenticatedRequest).user;

  // Define validation schema for loan funding
  const fundingValidationSchema: ValidationSchema = {
    amount: {
      type: "number",
      required: true,
      min: 0.01,
    },
  };

  // Validate request data
  if (!validateAndRespond({ amount }, fundingValidationSchema, res)) {
    return; // Response already sent by validateAndRespond
  }

  try {
    await fundLoanService(id, user.id, amount);

    return successResponse(res, 200, "Loan funded successfully.");
  } catch (error) {
    // Error funding loan
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
  const { page, pageSize, q, minAmount, maxAmount, sortBy } = req.query;

  // Define validation schema for query parameters
  const queryValidationSchema: ValidationSchema = {
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
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    q: q as string,
    minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
    maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
    sortBy: sortBy as string,
  };

  // Validate query parameters
  if (!validateAndRespond(queryData, queryValidationSchema, res)) {
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

    let sort: string | undefined = undefined;
    if (queryData.sortBy) {
      const rawSort = String(queryData.sortBy).trim();
      if (allowedFields.includes(rawSort)) {
        // default ordering for plain fields
        sort = `${rawSort}_desc`;
      } else {
        const m = rawSort.match(/^(.+)_(asc|desc)$/i);
        if (m) {
          const field = m[1];
          const dir = m[2].toLowerCase();
          if (
            allowedFields.includes(field) &&
            (dir === "asc" || dir === "desc")
          ) {
            sort = `${field}_${dir}`;
          }
        }
      }

      if (!sort) {
        // Return the same message shape used elsewhere for validation errors
        return errorResponse(
          res,
          400,
          "Validation failed for fields: sortBy. sortBy must be one of: createdAt_asc, createdAt_desc, amountRequested_asc, amountRequested_desc, interestRate_asc, interestRate_desc",
          {
            code: "VALIDATION_ERROR",
            fields: [
              {
                field: "sortBy",
                message:
                  "sortBy must be one of: createdAt_asc, createdAt_desc, amountRequested_asc, amountRequested_desc, interestRate_asc, interestRate_desc",
                expectedType: "string",
                receivedType: typeof queryData.sortBy,
              },
            ],
          }
        );
      }
    }

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
    // Error fetching open loans
    return errorResponse(res, 500, "An unexpected error occurred.");
  }
};

export const getMyLoans = async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  // Only borrowers can fetch their loans
  if (user.role !== "BORROWER") {
    return errorResponse(
      res,
      403,
      "Access denied. Only borrowers can view their loans."
    );
  }

  const { page, pageSize, q, minAmount, maxAmount, status } = req.query;

  // Validation schema for query parameters
  const queryValidationSchema: ValidationSchema = {
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
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    q: q as string,
    minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
    maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
    status: status as string,
  };

  if (!validateAndRespond(queryData, queryValidationSchema, res)) {
    return;
  }

  try {
    const pageNumber = queryData.page || 1;
    const size = queryData.pageSize || 10;
    const query = queryData.q;
    const min = queryData.minAmount;
    const max = queryData.maxAmount;
    const st = queryData.status;

    const { loans, totalCount, totalPages } = await getAllLoansByBorrower(
      user.id,
      pageNumber,
      size,
      query,
      min,
      max,
      st
    );

    return successResponse(res, 200, "User loans fetched successfully.", {
      loans,
      page: pageNumber,
      pageSize: size,
      totalCount,
      totalPages,
    });
  } catch (error) {
    // Error fetching user loans
    return errorResponse(res, 500, "An unexpected error occurred.");
  }
};
