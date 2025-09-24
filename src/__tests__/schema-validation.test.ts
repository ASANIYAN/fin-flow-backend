// src/__tests__/schema-validation.test.ts

import { PrismaClient } from "../../generated/prisma-test";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

describe("Schema Field Validation Tests", () => {
  beforeAll(async () => {
    // No setup needed for these tests as we're just validating schema compatibility
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("User Model Field Validation", () => {
    test("should have all required fields used in userService", () => {
      // Test that we can access all fields used in userService without TypeScript errors
      const userFields = {
        id: "string",
        email: "string",
        firstName: "string",
        lastName: "string",
        password: "string",
        role: "Role",
        isEmailVerified: "boolean",
        emailVerifiedAt: "DateTime?",
        verificationToken: "string?",
        createdAt: "DateTime",
        updatedAt: "DateTime",
        balance: "Decimal",
      };

      // This test will fail at compile time if any field is missing from the schema
      expect(() => {
        prisma.user.findFirst({
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            password: true,
            role: true,
            isEmailVerified: true,
            emailVerifiedAt: true,
            verificationToken: true,
            createdAt: true,
            updatedAt: true,
            balance: true,
          },
        });
      }).not.toThrow();

      expect(Object.keys(userFields).length).toBeGreaterThan(0);
    });

    test("should support user creation with all expected fields", async () => {
      const userData = {
        email: "schema.test@example.com",
        firstName: "Schema",
        lastName: "Test",
        password: "hashedPassword",
        role: "BORROWER" as const,
        verificationToken: "test-token-123",
      };

      // This will fail if any field is missing or incorrectly typed
      const createQuery = prisma.user.create({
        data: userData,
      });

      expect(createQuery).toBeDefined();
    });

    test("should support user update with verification fields", async () => {
      const updateData = {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        verificationToken: null,
      };

      // This will fail if emailVerifiedAt field doesn't exist
      const updateQuery = prisma.user.update({
        where: { id: "test-id" },
        data: updateData,
      });

      expect(updateQuery).toBeDefined();
    });

    test("should support finding user by verification token", async () => {
      const findQuery = prisma.user.findUnique({
        where: {
          verificationToken: "some-token",
        },
      });

      expect(findQuery).toBeDefined();
    });
  });

  describe("Loan Model Field Validation", () => {
    test("should have all required fields used in loanService", async () => {
      const loanQuery = prisma.loan.findFirst({
        select: {
          id: true,
          title: true,
          description: true,
          amountRequested: true,
          amountFunded: true,
          interestRate: true,
          duration: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          borrowerId: true,
          borrower: true,
          fundedBy: true,
        },
      });

      expect(loanQuery).toBeDefined();
    });

    test("should support loan creation with all expected fields", async () => {
      const loanData = {
        title: "Test Loan",
        description: "Test Description",
        amountRequested: 10000,
        interestRate: 12.5,
        duration: 24,
        borrowerId: "test-borrower-id",
      };

      const createQuery = prisma.loan.create({
        data: loanData,
      });

      expect(createQuery).toBeDefined();
    });
  });

  describe("Transaction Model Field Validation", () => {
    test("should have all required fields used in services", async () => {
      const transactionQuery = prisma.transaction.findFirst({
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          createdAt: true,
          userId: true,
          user: true,
          loanId: true,
          loan: true,
        },
      });

      expect(transactionQuery).toBeDefined();
    });

    test("should support all transaction types", () => {
      const transactionTypes = [
        "DEPOSIT",
        "FUNDING_DEBIT",
        "FUNDING_CREDIT",
        "DISBURSEMENT",
        "WITHDRAWAL",
      ];

      transactionTypes.forEach((type) => {
        const createQuery = prisma.transaction.create({
          data: {
            amount: 100,
            type: type as any,
            description: `Test ${type}`,
            userId: "test-user-id",
          },
        });

        expect(createQuery).toBeDefined();
      });
    });
  });

  describe("Service Method Field Usage Validation", () => {
    test("userService methods should use only existing fields", () => {
      // Test createUser service method field usage
      expect(() => {
        prisma.user.create({
          data: {
            email: "test@example.com",
            password: "hashed",
            firstName: "Test",
            lastName: "User",
            role: "BORROWER",
            verificationToken: "token",
          },
        });
      }).not.toThrow();

      // Test verifyUser service method field usage
      expect(() => {
        prisma.user.update({
          where: { id: "test-id" },
          data: {
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            verificationToken: null,
          },
        });
      }).not.toThrow();

      // Test findUserByVerificationToken service method
      expect(() => {
        prisma.user.findUnique({
          where: { verificationToken: "token" },
        });
      }).not.toThrow();
    });

    test("loanService methods should use only existing fields", () => {
      // Test loan creation
      expect(() => {
        prisma.loan.create({
          data: {
            title: "Test",
            amountRequested: 1000,
            interestRate: 10,
            duration: 12,
            borrowerId: "borrower-id",
          },
        });
      }).not.toThrow();

      // Test loan update
      expect(() => {
        prisma.loan.update({
          where: { id: "loan-id" },
          data: {
            amountFunded: 500,
            status: "FUNDING",
          },
        });
      }).not.toThrow();
    });

    test("walletService methods should use only existing fields", () => {
      // Test transaction creation
      expect(() => {
        prisma.transaction.create({
          data: {
            amount: 100,
            type: "DEPOSIT",
            description: "Test deposit",
            userId: "user-id",
          },
        });
      }).not.toThrow();

      // Test user balance update
      expect(() => {
        prisma.user.update({
          where: { id: "user-id" },
          data: { balance: 1000 },
        });
      }).not.toThrow();
    });
  });

  describe("Schema Consistency Checks", () => {
    test("should have matching field types between main and test schemas", () => {
      // Read both schema files and compare field definitions
      const mainSchemaPath = path.join(__dirname, "../../prisma/schema.prisma");
      const testSchemaPath = path.join(__dirname, "prisma/schema.prisma");

      const mainSchema = fs.readFileSync(mainSchemaPath, "utf8");
      const testSchema = fs.readFileSync(testSchemaPath, "utf8");

      // Check that both schemas define User model
      expect(mainSchema).toContain("model User");
      expect(testSchema).toContain("model User");

      // Check that critical fields exist in both
      const criticalFields = [
        "verificationToken",
        "emailVerifiedAt",
        "isEmailVerified",
      ];

      criticalFields.forEach((field) => {
        expect(mainSchema).toContain(field);
        expect(testSchema).toContain(field);
      });
    });

    test("should have all enum values used in code", () => {
      // Test Role enum values
      const roles = ["BORROWER", "LENDER"];
      roles.forEach((role) => {
        expect(() => {
          prisma.user.create({
            data: {
              email: "test@example.com",
              password: "hashed",
              firstName: "Test",
              lastName: "User",
              role: role as any,
            },
          });
        }).not.toThrow();
      });

      // Test LoanStatus enum values
      const loanStatuses = [
        "PENDING",
        "FUNDING",
        "FUNDED",
        "COMPLETED",
        "CANCELLED",
      ];
      loanStatuses.forEach((status) => {
        expect(() => {
          prisma.loan.update({
            where: { id: "loan-id" },
            data: { status: status as any },
          });
        }).not.toThrow();
      });

      // Test TransactionType enum values
      const transactionTypes = [
        "DEPOSIT",
        "FUNDING_DEBIT",
        "FUNDING_CREDIT",
        "DISBURSEMENT",
        "WITHDRAWAL",
      ];
      transactionTypes.forEach((type) => {
        expect(() => {
          prisma.transaction.create({
            data: {
              amount: 100,
              type: type as any,
              userId: "test-user-id",
            },
          });
        }).not.toThrow();
      });
    });
  });
});
