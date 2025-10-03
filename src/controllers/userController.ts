import { Request, Response } from "express";
import {
  getUserProfileService,
  getUserTransactionsService,
  updateUserProfileService,
} from "../services/userService";
import { AuthenticatedRequest } from "../types/auth";
import { errorResponse, successResponse } from "../utils/message";
import { validateAndRespond, ValidationSchema } from "../utils/validation";

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const user = req.user;

  try {
    const userProfile = await getUserProfileService(user.id);
    if (!userProfile) {
      return errorResponse(res, 404, "User not found.");
    }
    return successResponse(
      res,
      200,
      "User profile fetched successfully.",
      userProfile
    );
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return errorResponse(res, 500, "An unexpected error occurred.");
  }
};

export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const user = req.user;
  const updateData = req.body;

  // Define validation schema for profile update
  const profileUpdateValidationSchema: ValidationSchema = {
    firstName: {
      type: "string",
      required: false,
      minLength: 1,
      maxLength: 50,
    },
    lastName: {
      type: "string",
      required: false,
      minLength: 1,
      maxLength: 50,
    },
    email: {
      type: "string",
      required: false,
      minLength: 5,
      maxLength: 255,
    },
  };

  // Validate request data
  if (!validateAndRespond(updateData, profileUpdateValidationSchema, res)) {
    return; // Response already sent by validateAndRespond
  }

  try {
    const updatedProfile = await updateUserProfileService(user.id, updateData);
    return successResponse(
      res,
      200,
      "User profile updated successfully.",
      updatedProfile
    );
  } catch (error) {
    console.error("Error updating user profile:", error);
    if (error instanceof Error) {
      return errorResponse(res, 400, error.message);
    }
    return errorResponse(res, 500, "An unexpected error occurred.");
  }
};

export const getUserTransactions = async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const { page, pageSize, q } = req.query;

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
      maxLength: 255,
    },
  };

  // Validate query parameters
  const queryData = { page, pageSize, q };
  if (!validateAndRespond(queryData, queryValidationSchema, res)) {
    return; // Response already sent by validateAndRespond
  }

  // Parse query parameters with default values
  const pageNumber = parseInt(page as string) || 1;
  const size = parseInt(pageSize as string) || 10;
  const searchQuery = q as string;

  try {
    const { transactions, totalCount, totalPages } =
      await getUserTransactionsService(user.id, pageNumber, size, searchQuery);

    return successResponse(res, 200, "Transactions fetched successfully.", {
      transactions,
      page: pageNumber,
      pageSize: size,
      totalCount,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return errorResponse(res, 500, "An unexpected error occurred.");
  }
};
