import bcrypt from "bcrypt";
import crypto from "crypto";
import { PrismaClient } from "../lib/prisma";
import { Role } from "../../generated/prisma";

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
