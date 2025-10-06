import bcrypt from "bcrypt";
import crypto from "crypto";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();
const saltRounds = 10;

// Export prisma instance for testing
export { prisma };

export const createUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: Role
) => {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      verificationToken,
    },
  });
};

export const findUserByVerificationToken = async (token: string) => {
  return prisma.user.findUnique({
    where: {
      verificationToken: token,
    },
  });
};

export const verifyUser = async (userId: string) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      verificationToken: null, // Remove the token after successful verification
    },
  });
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      password: true,
      isEmailVerified: true,
      emailVerifiedAt: true,
      verificationToken: true,
      availableBalance: true,
      escrowBalance: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const comparePasswords = async (
  password: string,
  hashedPassword: string
) => {
  return bcrypt.compare(password, hashedPassword);
};

export const generatePasswordResetToken = async (email: string) => {
  const user = await findUserByEmail(email);

  // Security best practice: Do not reveal if the user exists or not
  if (!user) {
    return null;
  }

  // Generate a secure, URL-safe token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpires,
    },
  });

  return resetToken;
};

export const resetUserPassword = async (token: string, newPassword: string) => {
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { gt: new Date() }, // Check if token has not expired
    },
  });

  if (!user) {
    return null;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null, // Invalidate the token
      resetPasswordExpires: null,
    },
  });

  return user;
};

export const getUserProfileService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    // We only want to select non-sensitive fields for the public profile
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isEmailVerified: true,
      availableBalance: true,
      escrowBalance: true,
      createdAt: true,
    },
  });

  return {
    ...user,
    availableBalance: parseFloat(user.availableBalance.toString()),
    escrowBalance: parseFloat(user.escrowBalance.toString()),
  };
};

export const updateUserProfileService = async (
  userId: string,
  updateData: any
) => {
  // You should validate updateData here to ensure a user can only update
  // specific fields (e.g., firstName, lastName) and not sensitive ones like
  // email or password without proper verification.
  const validUpdateFields: any = {};
  if (updateData.firstName) validUpdateFields.firstName = updateData.firstName;
  if (updateData.lastName) validUpdateFields.lastName = updateData.lastName;

  // We should also check for an empty object to avoid unnecessary database calls
  if (Object.keys(validUpdateFields).length === 0) {
    throw new Error("No valid fields provided for update.");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: validUpdateFields,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });

  return updatedUser;
};

export const getUserTransactionsService = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  q?: string
) => {
  // Calculate skip for pagination
  const skip = (page - 1) * pageSize;

  // Build the dynamic 'where' clause for filtering and searching
  const where: any = {
    userId: userId,
  };

  if (q) {
    const searchTermUpper = q.toUpperCase();
    const orConditions: any[] = [{ description: { contains: q } }];

    // Only add type/status filters if the search term matches valid enum values
    const validTypes = [
      "DEPOSIT",
      "WITHDRAWAL",
      "LOAN_FUNDING",
      "LOAN_REPAYMENT",
    ];
    const validStatuses = ["PENDING", "REPAID", "FAILED"];

    if (validTypes.includes(searchTermUpper)) {
      orConditions.push({ type: { equals: searchTermUpper } });
    }

    if (validStatuses.includes(searchTermUpper)) {
      orConditions.push({ status: { equals: searchTermUpper } });
    }

    // Add loan title search if available
    orConditions.push({ loan: { title: { contains: q } } });

    where.OR = orConditions;
  }

  // Fetch the paginated and filtered transactions
  const transactions = await prisma.transaction.findMany({
    where,
    skip,
    take: pageSize,
    // We can also include related data for better context in the response
    include: {
      loan: {
        select: {
          title: true, // Only include the loan title for context
        },
      },
    },
    orderBy: {
      createdAt: "desc", // Sort by most recent transactions first
    },
  });

  // Get the total count of transactions for pagination (without skip/take)
  const totalCount = await prisma.transaction.count({ where });
  const totalPages = Math.ceil(totalCount / pageSize);

  return { transactions, totalCount, totalPages };
};
