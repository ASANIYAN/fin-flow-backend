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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NODE_ENV = "test";
process.env.TEST_DATABASE_URL = "file:./test.db";
const server_1 = __importDefault(require("../server"));
const supertest_1 = __importDefault(require("supertest"));
const userService_1 = require("../services/userService");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
describe("Loan Endpoints", () => {
    let borrowerToken;
    let lenderToken;
    let borrowerId;
    let lenderId;
    let loanId;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up test data before each test (order matters for foreign keys)
        yield userService_1.prisma.transaction.deleteMany({});
        yield userService_1.prisma.loan.deleteMany({});
        yield userService_1.prisma.user.deleteMany({});
        // Create test users
        const borrower = yield userService_1.prisma.user.create({
            data: {
                id: "test-borrower-id",
                email: "borrower@test.com",
                password: "hashedpassword",
                firstName: "Test",
                lastName: "Borrower",
                role: "BORROWER",
                isEmailVerified: true,
                emailVerifiedAt: new Date(),
                availableBalance: 0,
                escrowBalance: 0,
            },
        });
        const lender = yield userService_1.prisma.user.create({
            data: {
                id: "test-lender-id",
                email: "lender@test.com",
                password: "hashedpassword",
                firstName: "Test",
                lastName: "Lender",
                role: "LENDER",
                isEmailVerified: true,
                emailVerifiedAt: new Date(),
                availableBalance: 50000,
                escrowBalance: 0,
            },
        });
        borrowerId = borrower.id;
        lenderId = lender.id;
        // Generate JWT tokens
        borrowerToken = jsonwebtoken_1.default.sign({ userId: borrower.id, role: borrower.role }, JWT_SECRET);
        lenderToken = jsonwebtoken_1.default.sign({ userId: lender.id, role: lender.role }, JWT_SECRET);
        // Create a test loan
        const loan = yield userService_1.prisma.loan.create({
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
        yield new Promise((resolve) => setTimeout(resolve, 100));
    }));
    describe("GET /api/loans/dashboard", () => {
        it("should return borrower dashboard data", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/loans/dashboard")
                .set("Authorization", `Bearer ${borrowerToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("success", true);
            expect(res.body.data).toHaveProperty("totalApplications");
            expect(res.body.data).toHaveProperty("pendingApplications");
            expect(res.body.data).toHaveProperty("activeLoans");
            expect(Array.isArray(res.body.data.activeLoans)).toBe(true);
        }));
        it("should return lender dashboard data", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/loans/dashboard")
                .set("Authorization", `Bearer ${lenderToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("success", true);
            expect(res.body.data).toHaveProperty("investmentSummary");
            expect(res.body.data).toHaveProperty("newListings");
            expect(res.body.data.investmentSummary).toHaveProperty("totalInvested");
            expect(res.body.data.investmentSummary).toHaveProperty("totalEarnings");
            expect(res.body.data.investmentSummary).toHaveProperty("activeInvestments");
            expect(Array.isArray(res.body.data.newListings)).toBe(true);
        }));
        it("should require authentication", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default).get("/api/loans/dashboard");
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty("success", false);
        }));
    });
    describe("POST /api/loans/create-loan", () => {
        it("should create loan successfully for borrower", () => __awaiter(void 0, void 0, void 0, function* () {
            const loanData = {
                title: "Business Loan",
                description: "Loan for business expansion",
                amountRequested: 15000,
                interestRate: 8,
                duration: 18,
                durationUnit: "MONTHS",
            };
            const res = yield (0, supertest_1.default)(server_1.default)
                .post("/api/loans/create-loan")
                .set("Authorization", `Bearer ${borrowerToken}`)
                .send(loanData);
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty("success", true);
            expect(res.body.data).toHaveProperty("id");
        }));
        it("should reject loan creation for lender", () => __awaiter(void 0, void 0, void 0, function* () {
            const loanData = {
                title: "Business Loan",
                description: "Loan for business expansion",
                amountRequested: 15000,
                interestRate: 8,
                duration: 18,
                durationUnit: "MONTHS",
            };
            const res = yield (0, supertest_1.default)(server_1.default)
                .post("/api/loans/create-loan")
                .set("Authorization", `Bearer ${lenderToken}`)
                .send(loanData);
            expect(res.statusCode).toEqual(403);
            expect(res.body).toHaveProperty("success", false);
        }));
        it("should validate required fields", () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidData = {
                title: "",
                description: "Loan for business expansion",
            };
            const res = yield (0, supertest_1.default)(server_1.default)
                .post("/api/loans/create-loan")
                .set("Authorization", `Bearer ${borrowerToken}`)
                .send(invalidData);
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("success", false);
        }));
        it("should require authentication", () => __awaiter(void 0, void 0, void 0, function* () {
            const loanData = {
                title: "Business Loan",
                description: "Loan for business expansion",
                amountRequested: 15000,
                interestRate: 8,
                duration: 18,
                durationUnit: "MONTHS",
            };
            const res = yield (0, supertest_1.default)(server_1.default)
                .post("/api/loans/create-loan")
                .send(loanData);
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty("success", false);
        }));
    });
    describe("POST /api/loans/:id/fund", () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Ensure lender has sufficient balance
            yield userService_1.prisma.user.update({
                where: { id: lenderId },
                data: { availableBalance: 50000 },
            });
        }));
        it("should fund loan successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const fundingData = {
                amount: 5000,
            };
            const res = yield (0, supertest_1.default)(server_1.default)
                .post(`/api/loans/${loanId}/fund`)
                .set("Authorization", `Bearer ${lenderToken}`)
                .send(fundingData);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("success", true);
        }));
        it("should reject funding for borrower", () => __awaiter(void 0, void 0, void 0, function* () {
            const fundingData = {
                amount: 5000,
            };
            const res = yield (0, supertest_1.default)(server_1.default)
                .post(`/api/loans/${loanId}/fund`)
                .set("Authorization", `Bearer ${borrowerToken}`)
                .send(fundingData);
            expect(res.statusCode).toEqual(403);
            expect(res.body).toHaveProperty("success", false);
        }));
        it("should validate funding amount", () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidData = {
                amount: -100, // Negative amount
            };
            const res = yield (0, supertest_1.default)(server_1.default)
                .post(`/api/loans/${loanId}/fund`)
                .set("Authorization", `Bearer ${lenderToken}`)
                .send(invalidData);
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("success", false);
        }));
        it("should handle non-existent loan", () => __awaiter(void 0, void 0, void 0, function* () {
            const nonExistentId = "123e4567-e89b-12d3-a456-426614174999";
            const fundingData = {
                amount: 5000,
            };
            const res = yield (0, supertest_1.default)(server_1.default)
                .post(`/api/loans/${nonExistentId}/fund`)
                .set("Authorization", `Bearer ${lenderToken}`)
                .send(fundingData);
            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty("success", false);
        }));
    });
    describe("GET /api/loans/open", () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Create some test loans
            yield userService_1.prisma.loan.createMany({
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
        }));
        it("should return list of open loans", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/loans/open")
                .set("Authorization", `Bearer ${lenderToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("success", true);
            expect(res.body.data).toHaveProperty("loans");
            expect(Array.isArray(res.body.data.loans)).toBe(true);
            expect(res.body.data.loans.length).toBeGreaterThan(0);
        }));
        it("should filter loans by status", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/loans/open?status=PENDING")
                .set("Authorization", `Bearer ${lenderToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("success", true);
        }));
        it("should require authentication", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default).get("/api/loans/open");
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty("success", false);
        }));
    });
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield userService_1.prisma.$disconnect();
    }));
});
