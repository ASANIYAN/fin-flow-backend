process.env.NODE_ENV = "test";
process.env.TEST_DATABASE_URL = "file:./test.db";

import app from "../server";
import request from "supertest";
import { prisma } from "../services/userService";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

describe("User Endpoints", () => {
  let userToken: string;
  let userId: string;
  let unverifiedUserToken: string;
  let unverifiedUserId: string;

  beforeEach(async () => {
    // Clean up test data before each test (order matters for foreign keys)
    await prisma.transaction.deleteMany({});
    await prisma.emailVerificationToken.deleteMany({});
    await prisma.passwordResetToken.deleteMany({});
    await prisma.loan.deleteMany({});
    await prisma.user.deleteMany({});

    // Create verified test user
    const verifiedUser = await prisma.user.create({
      data: {
        id: "test-user-verified",
        email: "verified@test.com",
        password: "hashedpassword",
        firstName: "Verified",
        lastName: "User",
        role: "BORROWER",
        isEmailVerified: true,
        balance: 25000,
      },
    });

    // Create unverified test user
    const unverifiedUser = await prisma.user.create({
      data: {
        id: "test-user-unverified",
        email: "unverified@test.com",
        password: "hashedpassword",
        firstName: "Unverified",
        lastName: "User",
        role: "LENDER",
        isEmailVerified: false,
        balance: 0,
      },
    });

    userId = verifiedUser.id;
    unverifiedUserId = unverifiedUser.id;

    // Generate JWT tokens
    userToken = jwt.sign(
      { userId: verifiedUser.id, role: verifiedUser.role },
      JWT_SECRET
    );
    unverifiedUserToken = jwt.sign(
      { userId: unverifiedUser.id, role: unverifiedUser.role },
      JWT_SECRET
    );

    // Create some test transactions for the verified user
    await prisma.transaction.createMany({
      data: [
        {
          userId: userId,
          amount: 10000,
          type: "DEPOSIT",
          status: "COMPLETED",
          description: "Deposit via Paystack, Ref: ref_123456",
        },
        {
          userId: userId,
          amount: 5000,
          type: "WITHDRAWAL",
          status: "COMPLETED",
          description: "Withdrawal, Ref: TRF_123456",
        },
        {
          userId: userId,
          amount: 15000,
          type: "LOAN_FUNDING",
          status: "COMPLETED",
          description: "Loan funding transaction",
        },
      ],
    });

    // Wait a bit to ensure setup is complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/user/profile", () => {
    it("should get user profile successfully for verified user", async () => {
      const res = await request(app)
        .get("/api/user/profile")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty(
        "message",
        "User profile fetched successfully."
      );
      expect(res.body.data).toHaveProperty("id", userId);
      expect(res.body.data).toHaveProperty("email", "verified@test.com");
      expect(res.body.data).toHaveProperty("firstName", "Verified");
      expect(res.body.data).toHaveProperty("lastName", "User");
      expect(res.body.data).toHaveProperty("role", "BORROWER");
      expect(res.body.data).toHaveProperty("isEmailVerified", true);
      expect(res.body.data).toHaveProperty("createdAt");
      // Ensure sensitive fields are not returned
      expect(res.body.data).not.toHaveProperty("password");
      expect(res.body.data).not.toHaveProperty("verificationToken");
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/api/user/profile");

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain("Access denied");
    });

    it("should require email verification", async () => {
      const res = await request(app)
        .get("/api/user/profile")
        .set("Authorization", `Bearer ${unverifiedUserToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain("Email verification required");
    });

    it("should handle invalid token", async () => {
      const res = await request(app)
        .get("/api/user/profile")
        .set("Authorization", "Bearer invalid-token");

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should handle non-existent user", async () => {
      // Create a user first, then delete it, but keep a valid token
      const tempUser = await prisma.user.create({
        data: {
          email: "temp@test.com",
          password: "hashedpassword",
          firstName: "Temp",
          lastName: "User",
          role: "BORROWER",
          isEmailVerified: true,
        },
      });

      const tempToken = jwt.sign(
        { userId: tempUser.id, role: tempUser.role },
        JWT_SECRET
      );

      // Delete the user but keep the token
      await prisma.user.delete({ where: { id: tempUser.id } });

      const res = await request(app)
        .get("/api/user/profile")
        .set("Authorization", `Bearer ${tempToken}`);

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain("User account not found");
    });
  });

  describe("PATCH /api/user/profile", () => {
    const validUpdateData = {
      firstName: "UpdatedFirst",
      lastName: "UpdatedLast",
    };

    it("should update user profile successfully", async () => {
      const res = await request(app)
        .patch("/api/user/profile")
        .set("Authorization", `Bearer ${userToken}`)
        .send(validUpdateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty(
        "message",
        "User profile updated successfully."
      );
      expect(res.body.data).toHaveProperty("firstName", "UpdatedFirst");
      expect(res.body.data).toHaveProperty("lastName", "UpdatedLast");
      expect(res.body.data).toHaveProperty("email", "verified@test.com"); // Should remain unchanged

      // Verify the update persisted in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      expect(updatedUser?.firstName).toBe("UpdatedFirst");
      expect(updatedUser?.lastName).toBe("UpdatedLast");
    });

    it("should update only firstName", async () => {
      const partialUpdate = {
        firstName: "OnlyFirstName",
      };

      const res = await request(app)
        .patch("/api/user/profile")
        .set("Authorization", `Bearer ${userToken}`)
        .send(partialUpdate);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty("firstName", "OnlyFirstName");
      expect(res.body.data).toHaveProperty("lastName", "User"); // Should remain unchanged
    });

    it("should update only lastName", async () => {
      const partialUpdate = {
        lastName: "OnlyLastName",
      };

      const res = await request(app)
        .patch("/api/user/profile")
        .set("Authorization", `Bearer ${userToken}`)
        .send(partialUpdate);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty("firstName", "Verified"); // Should remain unchanged
      expect(res.body.data).toHaveProperty("lastName", "OnlyLastName");
    });

    it("should reject update with no valid fields", async () => {
      const invalidUpdate = {
        email: "newemail@test.com", // Should be ignored
        password: "newpassword", // Should be ignored
        role: "ADMIN", // Should be ignored
      };

      const res = await request(app)
        .patch("/api/user/profile")
        .set("Authorization", `Bearer ${userToken}`)
        .send(invalidUpdate);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain("No valid fields provided for update");
    });

    it("should reject empty update", async () => {
      const res = await request(app)
        .patch("/api/user/profile")
        .set("Authorization", `Bearer ${userToken}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain("No valid fields provided for update");
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .patch("/api/user/profile")
        .send(validUpdateData);

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should require email verification", async () => {
      const res = await request(app)
        .patch("/api/user/profile")
        .set("Authorization", `Bearer ${unverifiedUserToken}`)
        .send(validUpdateData);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("GET /api/user/transactions", () => {
    it("should get user transactions successfully", async () => {
      const res = await request(app)
        .get("/api/user/transactions")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty(
        "message",
        "Transactions fetched successfully."
      );
      expect(res.body.data).toHaveProperty("transactions");
      expect(res.body.data).toHaveProperty("page", 1);
      expect(res.body.data).toHaveProperty("pageSize", 10);
      expect(res.body.data).toHaveProperty("totalCount");
      expect(res.body.data).toHaveProperty("totalPages");

      expect(Array.isArray(res.body.data.transactions)).toBe(true);
      expect(res.body.data.transactions.length).toBe(3); // We created 3 test transactions
      expect(res.body.data.totalCount).toBe(3);

      // Verify transaction structure
      const transaction = res.body.data.transactions[0];
      expect(transaction).toHaveProperty("id");
      expect(transaction).toHaveProperty("amount");
      expect(transaction).toHaveProperty("type");
      expect(transaction).toHaveProperty("description");
      expect(transaction).toHaveProperty("createdAt");
    });

    it("should handle pagination correctly", async () => {
      const res = await request(app)
        .get("/api/user/transactions?page=1&pageSize=2")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty("page", 1);
      expect(res.body.data).toHaveProperty("pageSize", 2);
      expect(res.body.data.transactions.length).toBe(2);
      expect(res.body.data).toHaveProperty("totalCount", 3);
      expect(res.body.data).toHaveProperty("totalPages", 2);
    });

    it("should handle second page pagination", async () => {
      const res = await request(app)
        .get("/api/user/transactions?page=2&pageSize=2")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty("page", 2);
      expect(res.body.data).toHaveProperty("pageSize", 2);
      expect(res.body.data.transactions.length).toBe(1); // Only 1 transaction on page 2
    });

    it("should filter transactions by search query", async () => {
      const res = await request(app)
        .get("/api/user/transactions?q=DEPOSIT")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.transactions.length).toBe(1);
      expect(res.body.data.transactions[0].type).toBe("DEPOSIT");
    });

    it("should handle search query with no results", async () => {
      const res = await request(app)
        .get("/api/user/transactions?q=NONEXISTENT")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.transactions.length).toBe(0);
      expect(res.body.data.totalCount).toBe(0);
    });

    it("should handle default pagination parameters", async () => {
      const res = await request(app)
        .get("/api/user/transactions")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty("page", 1);
      expect(res.body.data).toHaveProperty("pageSize", 10);
    });

    it("should handle invalid pagination parameters gracefully", async () => {
      const res = await request(app)
        .get("/api/user/transactions?page=invalid&pageSize=invalid")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty("page", 1); // Should default to 1
      expect(res.body.data).toHaveProperty("pageSize", 10); // Should default to 10
    });

    it("should only return transactions for the authenticated user", async () => {
      // Create another user with transactions
      const otherUser = await prisma.user.create({
        data: {
          email: "other@test.com",
          password: "hashedpassword",
          firstName: "Other",
          lastName: "User",
          role: "LENDER",
          isEmailVerified: true,
          balance: 0,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: otherUser.id,
          amount: 1000,
          type: "DEPOSIT",
          status: "COMPLETED",
          description: "Other user transaction",
        },
      });

      const res = await request(app)
        .get("/api/user/transactions")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.transactions.length).toBe(3); // Should only see own transactions
      res.body.data.transactions.forEach((transaction: any) => {
        expect(transaction.userId).toBe(userId);
      });
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/api/user/transactions");

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should require email verification", async () => {
      const res = await request(app)
        .get("/api/user/transactions")
        .set("Authorization", `Bearer ${unverifiedUserToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty("success", false);
    });
  });
});
