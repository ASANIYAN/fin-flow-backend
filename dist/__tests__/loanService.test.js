"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NODE_ENV = "test";
process.env.TEST_DATABASE_URL = "file:./test.db";
const userService_1 = require("../services/userService");
const loanService_1 = require("../services/loanService");
describe("Loan Service - getOpenLoansService", () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up test data
        yield userService_1.prisma.transaction.deleteMany({});
        yield userService_1.prisma.loan.deleteMany({});
        yield userService_1.prisma.user.deleteMany({});
        // Create a borrower
        yield userService_1.prisma.user.create({
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
        yield userService_1.prisma.loan.create({
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
    }));
    it("returns loans containing durationUnit, totalInterest, principalRepaid, status, borrowerId and updatedAt", () => __awaiter(void 0, void 0, void 0, function* () {
        const { loans } = yield (0, loanService_1.getOpenLoansService)(1, 10);
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
    }));
    it("returns empty loans array when there are no open loans", () => __awaiter(void 0, void 0, void 0, function* () {
        // Remove all loans to simulate empty open loans
        yield userService_1.prisma.loan.deleteMany({});
        const { loans } = yield (0, loanService_1.getOpenLoansService)(1, 10);
        expect(Array.isArray(loans)).toBe(true);
        expect(loans.length).toBe(0);
    }));
    it("respects minAmount filter and returns no loans when filter excludes results", () => __awaiter(void 0, void 0, void 0, function* () {
        // Ensure at least one loan exists with amountRequested = 1000 (seeded in beforeEach)
        const { loans: initialLoans } = yield (0, loanService_1.getOpenLoansService)(1, 10);
        expect(initialLoans.length).toBeGreaterThanOrEqual(0);
        // Use a minAmount greater than any existing loan's amountRequested
        const { loans: filtered } = yield (0, loanService_1.getOpenLoansService)(1, 10, undefined, 999999);
        expect(Array.isArray(filtered)).toBe(true);
        expect(filtered.length).toBe(0);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield userService_1.prisma.$disconnect();
    }));
});
