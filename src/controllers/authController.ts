import { Request, Response } from "express";
import { createUser } from "../services/userService";
import { successResponse, errorResponse } from "../utils/message";
import { Prisma, Role } from "../../generated/prisma";

interface SignupRequestBody {
  email: string;
  password: string;
  fullName: string;
  role: Role;
}

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role } = req.body as SignupRequestBody;

    if (!email || !password || !fullName || !role) {
      return errorResponse(res, 400, "All fields are required");
    }

    if (!Object.values(Role).includes(role)) {
      return errorResponse(res, 400, "Invalid role provided");
    }

    const newUser = await createUser(email, password, fullName, role);

    const userData = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
    };

    return successResponse(res, 201, "User created successfully", userData);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(res, 409, "Email already in use");
    }

    console.error(error);
    return errorResponse(res, 500, "An unexpected error occurred", error);
  }
};
