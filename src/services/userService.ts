import bcrypt from "bcrypt";
import { PrismaClient, Role } from "../../generated/prisma";

const prisma = new PrismaClient();
const saltRounds = 10;

export const createUser = async (
  email: string,
  password: string,
  fullName: string,
  role: Role
) => {
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      role,
    },
  });
};
