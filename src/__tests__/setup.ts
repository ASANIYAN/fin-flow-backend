// src/__tests__/setup.ts

import { execSync } from "child_process";
import path from "path";
import * as fs from "fs";

export default async () => {
  try {
    console.log("Setting up test database...");

    // Set environment for testing
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "file:./test.db";

    // Remove existing test database if it exists
    const testDbPath = path.join(__dirname, "../../test.db");
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    const testSchemaPath = path.resolve(__dirname, "prisma/schema.prisma");

    // Push the schema to create the database structure using SQLite
    execSync(
      `DATABASE_URL="file:./test.db" npx prisma db push --schema=${testSchemaPath} --skip-generate --accept-data-loss`,
      {
        stdio: "inherit",
      }
    );

    // Generate Prisma client for tests
    execSync(
      `DATABASE_URL="file:./test.db" npx prisma generate --schema=${testSchemaPath}`,
      {
        stdio: "inherit",
      }
    );

    console.log("Test database setup complete");
  } catch (error) {
    console.error("Failed to set up test database:", error);
    process.exit(1);
  }
};
