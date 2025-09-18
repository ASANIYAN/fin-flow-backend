// src/__tests__/teardown.ts
import path from "path";
import * as fs from "fs";

export default async () => {
  try {
    // Remove the test database file
    const testDbPath = path.join(__dirname, "../../test.db");
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      console.log("Test database cleaned up successfully");
    }
  } catch (error) {
    console.warn("Warning: Could not clean up test database");
    console.error(error);
  }
};
