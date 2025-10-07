process.env.NODE_ENV = "test";
process.env.TEST_DATABASE_URL = "file:./test.db";

import app from "../server";
import request from "supertest";
import { prisma } from "../services/userService";
import jwt from "jsonwebtoken";
import axios from "axios";

// Mock axios for Paystack API calls
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

describe("Wallet Endpoints", () => {
  let userToken: string;
  let userId: string;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup Paystack API mocks
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes("/transaction/verify/")) {
        // Extract reference from URL and determine amount based on test scenario
        let amount = 1000000; // Default 10000 * 100 (kobo)

        if (url.includes("ref_balance_test")) {
          amount = 1500000; // 15000 * 100 (kobo)
        } else if (url.includes("ref_transaction_test")) {
          amount = 750000; // 7500 * 100 (kobo)
        }

        return Promise.resolve({
          data: {
            data: {
              status: "success",
              amount: amount,
              reference: url.split("/").pop(),
            },
          },
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    mockedAxios.post.mockImplementation((url, requestData) => {
      if (url.includes("/transferrecipient")) {
        const data =
          typeof requestData === "string"
            ? JSON.parse(requestData)
            : requestData;

        // Validate account number format (should be 10 digits)
        if (!data.account_number || data.account_number.length !== 10) {
          return Promise.reject({
            response: {
              status: 400,
              data: {
                status: false,
                message: "Invalid account number",
                type: "validation_error",
              },
            },
          });
        }

        // Validate bank code (should be 3 digits and valid)
        const validBankCodes = ["058", "044", "033", "070"]; // Add common bank codes
        if (!data.bank_code || !validBankCodes.includes(data.bank_code)) {
          return Promise.reject({
            response: {
              status: 400,
              data: {
                status: false,
                message: "Invalid bank code",
                type: "validation_error",
              },
            },
          });
        }

        return Promise.resolve({
          data: {
            data: {
              recipient_code: "RCP_test123456",
            },
          },
        });
      }
      if (url.includes("/transfer")) {
        return Promise.resolve({
          data: {
            data: {
              reference: "TRF_test123456",
            },
          },
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    // Clean up test data before each test (order matters for foreign keys)
    await prisma.transaction.deleteMany({});
    await prisma.loan.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: "wallet-user@test.com",
        password: "hashedpassword",
        firstName: "Wallet",
        lastName: "User",
        role: "LENDER",
        isEmailVerified: true,
        availableBalance: 50000, // Starting balance
        escrowBalance: 0,
      },
    });

    userId = user.id;

    // Generate JWT token
    userToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);

    // Wait a bit to ensure setup is complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/wallet/deposit", () => {
    const validDepositData = {
      amount: 10000,
      reference: "ref_test123456",
    };

    it("should deposit funds successfully", async () => {
      const res = await request(app)
        .post("/api/wallet/deposit")
        .set("Authorization", `Bearer ${userToken}`)
        .send(validDepositData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty(
        "message",
        "Payment confirmed. Balance update will follow shortly via webhook."
      );
    });

    it("should validate required fields", async () => {
      const invalidData = {
        amount: 10000,
        // Missing reference
      };

      const res = await request(app)
        .post("/api/wallet/deposit")
        .set("Authorization", `Bearer ${userToken}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain(
        "Validation failed for fields: reference"
      );
      expect(res.body.message).toContain(
        "reference is required and cannot be empty"
      );
    });

    it("should reject negative amounts", async () => {
      const invalidData = {
        amount: -1000,
        reference: "ref_negative",
      };

      const res = await request(app)
        .post("/api/wallet/deposit")
        .set("Authorization", `Bearer ${userToken}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should reject zero amounts", async () => {
      const invalidData = {
        amount: 0,
        reference: "ref_zero",
      };

      const res = await request(app)
        .post("/api/wallet/deposit")
        .set("Authorization", `Bearer ${userToken}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should reject non-numeric amounts", async () => {
      const invalidData = {
        amount: "not-a-number",
        reference: "ref_invalid",
      };

      const res = await request(app)
        .post("/api/wallet/deposit")
        .set("Authorization", `Bearer ${userToken}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should prevent duplicate transaction references", async () => {
      // First deposit
      await request(app)
        .post("/api/wallet/deposit")
        .set("Authorization", `Bearer ${userToken}`)
        .send(validDepositData);

      // Simulate webhook processing for the first transaction
      const { processVerifiedDeposit } = require("../services/walletService");
      await processVerifiedDeposit(
        userId,
        validDepositData.amount,
        validDepositData.reference
      );

      // Try to use same reference again
      const res = await request(app)
        .post("/api/wallet/deposit")
        .set("Authorization", `Bearer ${userToken}`)
        .send(validDepositData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .post("/api/wallet/deposit")
        .send(validDepositData);

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("POST /api/wallet/withdraw", () => {
    const validWithdrawData = {
      amount: 5000,
      accountNumber: "0123456789",
      bankCode: "058",
    };

    it("should initiate withdrawal successfully", async () => {
      const res = await request(app)
        .post("/api/wallet/withdraw")
        .set("Authorization", `Bearer ${userToken}`)
        .send(validWithdrawData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
    });

    it("should validate required fields", async () => {
      const invalidData = {
        amount: 5000,
        // Missing accountNumber and bankCode
      };

      const res = await request(app)
        .post("/api/wallet/withdraw")
        .set("Authorization", `Bearer ${userToken}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should reject negative amounts", async () => {
      const invalidData = {
        amount: -1000,
        accountNumber: "0123456789",
        bankCode: "058",
      };

      const res = await request(app)
        .post("/api/wallet/withdraw")
        .set("Authorization", `Bearer ${userToken}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should reject withdrawal exceeding balance", async () => {
      const excessiveAmount = {
        amount: 100000, // More than the user's balance (50000)
        accountNumber: "0123456789",
        bankCode: "058",
      };

      const res = await request(app)
        .post("/api/wallet/withdraw")
        .set("Authorization", `Bearer ${userToken}`)
        .send(excessiveAmount);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain("Insufficient funds in wallet");
    });

    it("should validate account number format", async () => {
      const invalidAccount = {
        amount: 5000,
        accountNumber: "123", // Too short
        bankCode: "058",
      };

      const res = await request(app)
        .post("/api/wallet/withdraw")
        .set("Authorization", `Bearer ${userToken}`)
        .send(invalidAccount);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should validate bank code format", async () => {
      const invalidBankCode = {
        amount: 5000,
        accountNumber: "0123456789",
        bankCode: "99", // Invalid bank code
      };

      const res = await request(app)
        .post("/api/wallet/withdraw")
        .set("Authorization", `Bearer ${userToken}`)
        .send(invalidBankCode);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .post("/api/wallet/withdraw")
        .send(validWithdrawData);

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("Wallet Balance Updates", () => {
    it("should update user balance after deposit", async () => {
      const depositData = {
        amount: 15000,
        reference: "ref_balance_test",
      };

      await request(app)
        .post("/api/wallet/deposit")
        .set("Authorization", `Bearer ${userToken}`)
        .send(depositData);

      // Simulate webhook processing by directly calling processVerifiedDeposit
      const { processVerifiedDeposit } = require("../services/walletService");
      await processVerifiedDeposit(userId, 15000, "ref_balance_test");

      // Check if balance was updated
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { availableBalance: true },
      });

      expect(user?.availableBalance.toNumber()).toEqual(65000); // 50000 + 15000
    });

    it("should update user balance after withdrawal", async () => {
      const withdrawData = {
        amount: 10000,
        accountNumber: "0123456789",
        bankCode: "058",
      };

      await request(app)
        .post("/api/wallet/withdraw")
        .set("Authorization", `Bearer ${userToken}`)
        .send(withdrawData);

      // Check if balance was updated
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { availableBalance: true },
      });

      expect(user?.availableBalance.toNumber()).toEqual(40000); // 50000 - 10000
    });

    it("should create transaction records", async () => {
      const depositData = {
        amount: 7500,
        reference: "ref_transaction_test",
      };

      await request(app)
        .post("/api/wallet/deposit")
        .set("Authorization", `Bearer ${userToken}`)
        .send(depositData);

      // Simulate webhook processing by directly calling processVerifiedDeposit
      const { processVerifiedDeposit } = require("../services/walletService");
      await processVerifiedDeposit(userId, 7500, "ref_transaction_test");

      // Check if transaction was recorded
      const transactions = await prisma.transaction.findMany({
        where: { userId: userId },
      });

      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount.toNumber()).toEqual(7500);
      expect(transactions[0].type).toEqual("DEPOSIT");
    });
  });
});
