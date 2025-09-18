/** @type {import('jest').Config} */

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  setupFiles: ["dotenv/config"],
  // New: Global setup and teardown for the test database
  globalSetup: "<rootDir>/src/__tests__/setup.ts",
  globalTeardown: "<rootDir>/src/__tests__/teardown.ts",
};
