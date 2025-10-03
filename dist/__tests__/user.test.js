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
const prisma_1 = require("../lib/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
describe("User Endpoints", () => {
    let userToken;
    let userId;
    let unverifiedUserToken;
    let unverifiedUserId;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up test data before each test (order matters for foreign keys)
        yield userService_1.prisma.transaction.deleteMany({});
        yield userService_1.prisma.loan.deleteMany({});
        yield userService_1.prisma.user.deleteMany({});
        // Create verified test user
        const verifiedUser = yield userService_1.prisma.user.create({
            data: {
                id: "test-user-verified",
                email: "verified@test.com",
                password: "hashedpassword",
                firstName: "Verified",
                lastName: "User",
                role: "BORROWER",
                isEmailVerified: true,
                emailVerifiedAt: new Date(),
                availableBalance: 25000,
                escrowBalance: 0,
            },
        });
        userId = verifiedUser.id;
        const unverifiedUser = yield userService_1.prisma.user.create({
            data: {
                id: "test-user-unverified",
                email: "unverified@test.com",
                password: "hashedpassword",
                firstName: "Unverified",
                lastName: "User",
                role: "LENDER",
                availableBalance: 0,
                escrowBalance: 0,
            },
        });
        userId = verifiedUser.id;
        unverifiedUserId = unverifiedUser.id;
        // Generate JWT tokens
        userToken = jsonwebtoken_1.default.sign({ userId: verifiedUser.id, role: verifiedUser.role }, JWT_SECRET);
        unverifiedUserToken = jsonwebtoken_1.default.sign({ userId: unverifiedUser.id, role: unverifiedUser.role }, JWT_SECRET);
        // Create some test transactions for the verified user
        yield userService_1.prisma.transaction.createMany({
            data: [
                {
                    userId: userId,
                    amount: 10000,
                    type: prisma_1.TransactionType.DEPOSIT,
                    description: "Deposit via Paystack, Ref: ref_123456",
                },
                {
                    userId: userId,
                    amount: 5000,
                    type: prisma_1.TransactionType.WITHDRAWAL,
                    description: "Withdrawal, Ref: TRF_123456",
                },
                {
                    userId: userId,
                    amount: 15000,
                    type: prisma_1.TransactionType.FUNDING_COMMIT,
                    description: "Loan funding transaction",
                },
            ],
        });
        // Wait a bit to ensure setup is complete
        yield new Promise((resolve) => setTimeout(resolve, 100));
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield userService_1.prisma.$disconnect();
    }));
    describe("GET /api/user/profile", () => {
        it("should get user profile successfully for verified user", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/user/profile")
                .set("Authorization", `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("success", true);
            expect(res.body).toHaveProperty("message", "User profile fetched successfully.");
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
        }));
        it("should require authentication", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default).get("/api/user/profile");
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty("success", false);
            expect(res.body.message).toContain("Access denied");
        }));
        it("should require email verification", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/user/profile")
                .set("Authorization", `Bearer ${unverifiedUserToken}`);
            expect(res.statusCode).toEqual(403);
            expect(res.body).toHaveProperty("success", false);
            expect(res.body.message).toContain("Email verification required");
        }));
        it("should handle invalid token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/user/profile")
                .set("Authorization", "Bearer invalid-token");
            expect(res.statusCode).toEqual(403);
            expect(res.body).toHaveProperty("success", false);
        }));
        it("should handle non-existent user", () => __awaiter(void 0, void 0, void 0, function* () {
            // Create a user first, then delete it, but keep a valid token
            const tempUser = yield userService_1.prisma.user.create({
                data: {
                    email: "temp@test.com",
                    password: "hashedpassword",
                    firstName: "Temp",
                    lastName: "User",
                    role: "BORROWER",
                    isEmailVerified: true,
                },
            });
            const tempToken = jsonwebtoken_1.default.sign({ userId: tempUser.id, role: tempUser.role }, JWT_SECRET);
            // Delete the user but keep the token
            yield userService_1.prisma.user.delete({ where: { id: tempUser.id } });
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/user/profile")
                .set("Authorization", `Bearer ${tempToken}`);
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty("success", false);
            expect(res.body.message).toContain("User account not found");
        }));
    });
    describe("PATCH /api/user/profile", () => {
        const validUpdateData = {
            firstName: "UpdatedFirst",
            lastName: "UpdatedLast",
        };
        it("should update user profile successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .patch("/api/user/profile")
                .set("Authorization", `Bearer ${userToken}`)
                .send(validUpdateData);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("success", true);
            expect(res.body).toHaveProperty("message", "User profile updated successfully.");
            expect(res.body.data).toHaveProperty("firstName", "UpdatedFirst");
            expect(res.body.data).toHaveProperty("lastName", "UpdatedLast");
            expect(res.body.data).toHaveProperty("email", "verified@test.com"); // Should remain unchanged
            // Verify the update persisted in database
            const updatedUser = yield userService_1.prisma.user.findUnique({
                where: { id: userId },
                select: { firstName: true, lastName: true },
            });
            expect(updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.firstName).toBe("UpdatedFirst");
            expect(updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.lastName).toBe("UpdatedLast");
        }));
        it("should update only firstName", () => __awaiter(void 0, void 0, void 0, function* () {
            const partialUpdate = {
                firstName: "OnlyFirstName",
            };
            const res = yield (0, supertest_1.default)(server_1.default)
                .patch("/api/user/profile")
                .set("Authorization", `Bearer ${userToken}`)
                .send(partialUpdate);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveProperty("firstName", "OnlyFirstName");
            expect(res.body.data).toHaveProperty("lastName", "User"); // Should remain unchanged
        }));
        it("should update only lastName", () => __awaiter(void 0, void 0, void 0, function* () {
            const partialUpdate = {
                lastName: "OnlyLastName",
            };
            const res = yield (0, supertest_1.default)(server_1.default)
                .patch("/api/user/profile")
                .set("Authorization", `Bearer ${userToken}`)
                .send(partialUpdate);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveProperty("firstName", "Verified"); // Should remain unchanged
            expect(res.body.data).toHaveProperty("lastName", "OnlyLastName");
        }));
        it("should reject update with no valid fields", () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidUpdate = {
                email: "newemail@test.com", // Should be ignored
                password: "newpassword", // Should be ignored
                role: "ADMIN", // Should be ignored
            };
            const res = yield (0, supertest_1.default)(server_1.default)
                .patch("/api/user/profile")
                .set("Authorization", `Bearer ${userToken}`)
                .send(invalidUpdate);
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("success", false);
            expect(res.body.message).toContain("No valid fields provided for update");
        }));
        it("should reject empty update", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .patch("/api/user/profile")
                .set("Authorization", `Bearer ${userToken}`)
                .send({});
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("success", false);
            expect(res.body.message).toContain("No valid fields provided for update");
        }));
        it("should require authentication", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .patch("/api/user/profile")
                .send(validUpdateData);
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty("success", false);
        }));
        it("should require email verification", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .patch("/api/user/profile")
                .set("Authorization", `Bearer ${unverifiedUserToken}`)
                .send(validUpdateData);
            expect(res.statusCode).toEqual(403);
            expect(res.body).toHaveProperty("success", false);
        }));
    });
    describe("GET /api/user/transactions", () => {
        it("should get user transactions successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/user/transactions")
                .set("Authorization", `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("success", true);
            expect(res.body).toHaveProperty("message", "Transactions fetched successfully.");
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
        }));
        it("should handle pagination correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/user/transactions?page=1&pageSize=2")
                .set("Authorization", `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveProperty("page", 1);
            expect(res.body.data).toHaveProperty("pageSize", 2);
            expect(res.body.data.transactions.length).toBe(2);
            expect(res.body.data).toHaveProperty("totalCount", 3);
            expect(res.body.data).toHaveProperty("totalPages", 2);
        }));
        it("should handle second page pagination", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/user/transactions?page=2&pageSize=2")
                .set("Authorization", `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveProperty("page", 2);
            expect(res.body.data).toHaveProperty("pageSize", 2);
            expect(res.body.data.transactions.length).toBe(1); // Only 1 transaction on page 2
        }));
        it("should filter transactions by search query", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/user/transactions?q=DEPOSIT")
                .set("Authorization", `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.transactions.length).toBe(1);
            expect(res.body.data.transactions[0].type).toBe("DEPOSIT");
        }));
        it("should handle search query with no results", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/user/transactions?q=NONEXISTENT")
                .set("Authorization", `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.transactions.length).toBe(0);
            expect(res.body.data.totalCount).toBe(0);
        }));
        it("should handle default pagination parameters", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/user/transactions")
                .set("Authorization", `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveProperty("page", 1);
            expect(res.body.data).toHaveProperty("pageSize", 10);
        }));
        it("should handle invalid pagination parameters gracefully", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/user/transactions?page=invalid&pageSize=invalid")
                .set("Authorization", `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveProperty("page", 1); // Should default to 1
            expect(res.body.data).toHaveProperty("pageSize", 10); // Should default to 10
        }));
        it("should only return transactions for the authenticated user", () => __awaiter(void 0, void 0, void 0, function* () {
            // Create another user with transactions
            const otherUser = yield userService_1.prisma.user.create({
                data: {
                    email: "other@test.com",
                    password: "hashedpassword",
                    firstName: "Other",
                    lastName: "User",
                    role: "LENDER",
                    isEmailVerified: true,
                    availableBalance: 0,
                    escrowBalance: 0,
                },
            });
            yield userService_1.prisma.transaction.create({
                data: {
                    userId: otherUser.id,
                    amount: 1000,
                    type: prisma_1.TransactionType.DEPOSIT,
                    description: "Other user transaction",
                },
            });
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/user/transactions")
                .set("Authorization", `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.transactions.length).toBe(3); // Should only see own transactions
            res.body.data.transactions.forEach((transaction) => {
                expect(transaction.userId).toBe(userId);
            });
        }));
        it("should require authentication", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default).get("/api/user/transactions");
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty("success", false);
        }));
        it("should require email verification", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default)
                .get("/api/user/transactions")
                .set("Authorization", `Bearer ${unverifiedUserToken}`);
            expect(res.statusCode).toEqual(403);
            expect(res.body).toHaveProperty("success", false);
        }));
    });
});
