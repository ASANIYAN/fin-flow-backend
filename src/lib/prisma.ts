// Environment-aware Prisma client for handling dev vs test databases

let PrismaClient: any;

try {
  if (process.env.NODE_ENV === "test") {
    // Use test-specific client when in test environment
    PrismaClient = require("../../generated/prisma-test").PrismaClient;
  } else {
    // Use main client for development and production
    PrismaClient = require("../../generated/prisma").PrismaClient;
  }
} catch (error) {
  console.warn(
    "Could not load environment-specific Prisma client, falling back to main client"
  );
  PrismaClient = require("../../generated/prisma").PrismaClient;
}

export { PrismaClient };
export * from "../../generated/prisma"; // Export other types from main client
