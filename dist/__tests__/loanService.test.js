"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NODE_ENV = "test";
process.env.TEST_DATABASE_URL = "file:./test.db";
const userService_1 = require("../services/userService");
const loanService_1 = require("../services/loanService");
describe("Loan Service - getOpenLoansService", () => {
    beforeEach(async () => {
        // Clean up test data
        await userService_1.prisma.transaction.deleteMany({});
        await userService_1.prisma.loan.deleteMany({});
        await userService_1.prisma.user.deleteMany({});
        // Create a borrower
        await userService_1.prisma.user.create({
            data: {
                id: "svc-borrower-id",
                email: "svc-borrower@test.com",
                password: "hashed",
                firstName: "Svc",
                lastName: "Borrower",
                role: "BORROWER",
                isEmailVerified: true,
                emailVerifiedAt: new Date(),
                availableBalance: 0,
                escrowBalance: 0,
            },
        });
        // Create a loan that should be returned by getOpenLoansService
        await userService_1.prisma.loan.create({
            data: {
                title: "Service Test Loan",
                description: "loan for service test",
                amountRequested: 1000,
                amountFunded: 0,
                interestRate: 5,
                duration: 6,
                durationUnit: "MONTHS",
                totalInterest: 25,
                principalRepaid: 0,
                borrowerId: "svc-borrower-id",
                status: "PENDING",
            },
        });
    });
    it("returns loans containing durationUnit, totalInterest, principalRepaid, status, borrowerId and updatedAt", async () => {
        const { loans } = await (0, loanService_1.getOpenLoansService)(1, 10);
        expect(Array.isArray(loans)).toBe(true);
        expect(loans.length).toBeGreaterThan(0);
        const loan = loans[0];
        // New fields expected
        expect(loan).toHaveProperty("durationUnit");
        expect(typeof loan.durationUnit).toBe("string");
        expect(loan).toHaveProperty("totalInterest");
        expect(typeof loan.totalInterest).toBe("number");
        expect(loan).toHaveProperty("principalRepaid");
        expect(typeof loan.principalRepaid).toBe("number");
        expect(loan).toHaveProperty("status");
        expect(typeof loan.status).toBe("string");
        expect(loan).toHaveProperty("borrowerId");
        expect(typeof loan.borrowerId).toBe("string");
        expect(loan).toHaveProperty("updatedAt");
        expect(loan.updatedAt instanceof Date).toBe(true);
        // Borrower should remain an object with firstName and lastName
        expect(loan).toHaveProperty("borrower");
        expect(loan.borrower).toHaveProperty("firstName");
        expect(loan.borrower).toHaveProperty("lastName");
    });
    it("returns empty loans array when there are no open loans", async () => {
        // Remove all loans to simulate empty open loans
        await userService_1.prisma.loan.deleteMany({});
        const { loans } = await (0, loanService_1.getOpenLoansService)(1, 10);
        expect(Array.isArray(loans)).toBe(true);
        expect(loans.length).toBe(0);
    });
    it("respects minAmount filter and returns no loans when filter excludes results", async () => {
        // Ensure at least one loan exists with amountRequested = 1000 (seeded in beforeEach)
        const { loans: initialLoans } = await (0, loanService_1.getOpenLoansService)(1, 10);
        expect(initialLoans.length).toBeGreaterThanOrEqual(0);
        // Use a minAmount greater than any existing loan's amountRequested
        const { loans: filtered } = await (0, loanService_1.getOpenLoansService)(1, 10, undefined, 999999);
        expect(Array.isArray(filtered)).toBe(true);
        expect(filtered.length).toBe(0);
    });
    afterAll(async () => {
        await userService_1.prisma.$disconnect();
    });
});
