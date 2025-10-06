import { PrismaClient } from "@prisma/client";

// Singleton PrismaClient instance
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Export the PrismaClient instance and all generated types
export default prisma;
export * from "@prisma/client";
