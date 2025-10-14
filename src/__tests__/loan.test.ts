process.env.NODE_ENV = "test";
process.env.TEST_DATABASE_URL = "file:./test.db";

import app from "../server";
import request from "supertest";
import { prisma } from "../services/userService";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

describe("Loan Endpoints", () => {
  let borrowerToken: string;
  let lenderToken: string;
  let borrowerId: string;
  let lenderId: string;
  let loanId: string;

  beforeEach(async () => {
    // Clean up test data before each test (order matters for foreign keys)
    await prisma.transaction.deleteMany({});
    await prisma.loan.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test users
    const borrower = await prisma.user.create({
      data: {
        id: "test-borrower-id",
        email: "borrower@test.com",
        password: "hashedpassword",
        firstName: "Test",
        lastName: "Borrower",
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        availableBalance: 0,
        escrowBalance: 0,
      },
    });

    const lender = await prisma.user.create({
      data: {
        id: "test-lender-id",
        email: "lender@test.com",
        password: "hashedpassword",
        firstName: "Test",
        lastName: "Lender",
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        availableBalance: 50000,
        escrowBalance: 0,
      },
    });

    borrowerId = borrower.id;
    lenderId = lender.id;

    // Generate JWT tokens
    borrowerToken = jwt.sign({ userId: borrower.id }, JWT_SECRET);
    lenderToken = jwt.sign({ userId: lender.id }, JWT_SECRET);

    // Create a test loan
    const loan = await prisma.loan.create({
      data: {
        title: "Test Loan",
        description: "A loan for testing",
        amountRequested: 10000,
        interestRate: 10,
        duration: 12,
        durationUnit: "MONTHS",
        totalInterest: 1000,
        borrowerId: borrowerId,
        status: "PENDING",
      },
    });

    loanId = loan.id;

    // Wait a bit to ensure setup is complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe("GET /api/loans/dashboard", () => {
    it("should return borrower dashboard data", async () => {
      const res = await request(app)
        .get("/api/loans/dashboard")
        .set("Authorization", `Bearer ${borrowerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("totalApplications");
      expect(res.body.data).toHaveProperty("pendingApplications");
      expect(res.body.data).toHaveProperty("activeLoansAsBorrower");
      expect(Array.isArray(res.body.data.activeLoansAsBorrower)).toBe(true);
    });

    it("should return lender dashboard data", async () => {
      const res = await request(app)
        .get("/api/loans/dashboard")
        .set("Authorization", `Bearer ${lenderToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("investmentSummary");
      expect(res.body.data).toHaveProperty("newListings");
      expect(res.body.data.investmentSummary).toHaveProperty("totalInvested");
      expect(res.body.data.investmentSummary).toHaveProperty("totalEarnings");
      expect(res.body.data.investmentSummary).toHaveProperty(
        "activeInvestments"
      );
      expect(Array.isArray(res.body.data.newListings)).toBe(true);
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/api/loans/dashboard");

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("POST /api/loans/create-loan", () => {
    it("should create loan successfully for borrower", async () => {
      const loanData = {
        title: "Business Loan",
        description: "Loan for business expansion",
        amountRequested: 15000,
        interestRate: 8,
        duration: 18,
        durationUnit: "MONTHS",
      };

      const res = await request(app)
        .post("/api/loans/create-loan")
        .set("Authorization", `Bearer ${borrowerToken}`)
        .send(loanData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("id");
    });

    it("should allow any authenticated user to create a loan", async () => {
      const loanData = {
        title: "Business Loan",
        description: "Loan for business expansion",
        amountRequested: 15000,
        interestRate: 8,
        duration: 18,
        durationUnit: "MONTHS",
      };

      const res = await request(app)
        .post("/api/loans/create-loan")
        .set("Authorization", `Bearer ${lenderToken}`)
        .send(loanData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("id");
    });

    it("should validate required fields", async () => {
      const invalidData = {
        title: "",
        description: "Loan for business expansion",
      };

      const res = await request(app)
        .post("/api/loans/create-loan")
        .set("Authorization", `Bearer ${borrowerToken}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should require authentication", async () => {
      const loanData = {
        title: "Business Loan",
        description: "Loan for business expansion",
        amountRequested: 15000,
        interestRate: 8,
        duration: 18,
        durationUnit: "MONTHS",
      };

      const res = await request(app)
        .post("/api/loans/create-loan")
        .send(loanData);

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("POST /api/loans/:id/fund", () => {
    beforeEach(async () => {
      // Ensure lender has sufficient balance
      await prisma.user.update({
        where: { id: lenderId },
        data: { availableBalance: 50000 },
      });
    });

    it("should fund loan successfully", async () => {
      const fundingData = {
        amount: 5000,
      };

      const res = await request(app)
        .post(`/api/loans/${loanId}/fund`)
        .set("Authorization", `Bearer ${lenderToken}`)
        .send(fundingData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
    });

    it("should reject self-funding (borrower cannot fund their own loan)", async () => {
      const fundingData = {
        amount: 5000,
      };

      const res = await request(app)
        .post(`/api/loans/${loanId}/fund`)
        .set("Authorization", `Bearer ${borrowerToken}`)
        .send(fundingData);

      expect(res.statusCode).toEqual(400); // Updated to expect 400 for self-funding prevention
      expect(res.body).toHaveProperty("success", false);
    });

    it("should validate funding amount", async () => {
      const invalidData = {
        amount: -100, // Negative amount
      };

      const res = await request(app)
        .post(`/api/loans/${loanId}/fund`)
        .set("Authorization", `Bearer ${lenderToken}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should handle non-existent loan", async () => {
      const nonExistentId = "123e4567-e89b-12d3-a456-426614174999";
      const fundingData = {
        amount: 5000,
      };

      const res = await request(app)
        .post(`/api/loans/${nonExistentId}/fund`)
        .set("Authorization", `Bearer ${lenderToken}`)
        .send(fundingData);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("GET /api/loans/open", () => {
    beforeEach(async () => {
      // Create some test loans
      await prisma.loan.createMany({
        data: [
          {
            title: "Loan 1",
            description: "Description 1",
            amountRequested: 10000,
            interestRate: 10,
            duration: 12,
            durationUnit: "MONTHS",
            totalInterest: 1000,
            borrowerId: borrowerId,
            status: "PENDING",
          },
          {
            title: "Loan 2",
            description: "Description 2",
            amountRequested: 20000,
            interestRate: 12,
            duration: 24,
            durationUnit: "MONTHS",
            totalInterest: 4800,
            borrowerId: borrowerId,
            status: "PENDING",
          },
        ],
      });
    });

    it("should return list of open loans", async () => {
      const res = await request(app)
        .get("/api/loans/open")
        .set("Authorization", `Bearer ${lenderToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("loans");
      expect(Array.isArray(res.body.data.loans)).toBe(true);
      expect(res.body.data.loans.length).toBeGreaterThan(0);
    });

    it("should filter loans by status", async () => {
      const res = await request(app)
        .get("/api/loans/open?status=PENDING")
        .set("Authorization", `Bearer ${lenderToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/api/loans/open");

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("DELETE /api/loans/:id/delete", () => {
    let deletableLoanId: string;

    beforeEach(async () => {
      // Create a test loan specifically for deletion tests
      const loan = await prisma.loan.create({
        data: {
          title: "Deletable Loan",
          description: "A loan that can be deleted",
          amountRequested: 5000,
          interestRate: 10,
          duration: 12,
          durationUnit: "MONTHS",
          totalInterest: 500,
          borrowerId: borrowerId,
          status: "PENDING",
          amountFunded: 0,
        },
      });
      deletableLoanId = loan.id;
    });

    it("should delete loan successfully by owner", async () => {
      const res = await request(app)
        .delete(`/api/loans/${deletableLoanId}/delete`)
        .set("Authorization", `Bearer ${borrowerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty(
        "message",
        "Loan application deleted successfully."
      );
      expect(res.body.data).toHaveProperty("id", deletableLoanId);

      // Verify loan is actually deleted from database
      const deletedLoan = await prisma.loan.findUnique({
        where: { id: deletableLoanId },
      });
      expect(deletedLoan).toBeNull();
    });

    it("should reject deletion by non-owner", async () => {
      const res = await request(app)
        .delete(`/api/loans/${deletableLoanId}/delete`)
        .set("Authorization", `Bearer ${lenderToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty(
        "message",
        "You can only delete your own loan applications."
      );
    });

    it("should reject deletion of non-existent loan", async () => {
      const nonExistentId = "123e4567-e89b-12d3-a456-426614174999";

      const res = await request(app)
        .delete(`/api/loans/${nonExistentId}/delete`)
        .set("Authorization", `Bearer ${borrowerToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Loan not found.");
    });

    it("should reject deletion of funded loan", async () => {
      // Update the loan to have some funding
      await prisma.loan.update({
        where: { id: deletableLoanId },
        data: { amountFunded: 1000 },
      });

      const res = await request(app)
        .delete(`/api/loans/${deletableLoanId}/delete`)
        .set("Authorization", `Bearer ${borrowerToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain(
        "Can only delete loans that are in PENDING status and have not received any funding"
      );
    });

    it("should reject deletion of non-pending loan", async () => {
      // Update the loan status to something other than PENDING
      await prisma.loan.update({
        where: { id: deletableLoanId },
        data: { status: "FUNDING" },
      });

      const res = await request(app)
        .delete(`/api/loans/${deletableLoanId}/delete`)
        .set("Authorization", `Bearer ${borrowerToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain(
        "Can only delete loans that are in PENDING status and have not received any funding"
      );
    });

    it("should require authentication", async () => {
      const res = await request(app).delete(
        `/api/loans/${deletableLoanId}/delete`
      );

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("success", false);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
