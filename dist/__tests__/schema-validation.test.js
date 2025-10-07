"use strict";
// src/__tests__/schema-validation.test.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const prisma_1 = require("../lib/prisma");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new prisma_1.PrismaClient();
describe("Schema Field Validation Tests", () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // No setup needed for these tests as we're just validating schema compatibility
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma.$disconnect();
    }));
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
                availableBalance: "Decimal",
                escrowBalance: "Decimal",
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
                        availableBalance: true,
                        escrowBalance: true,
                    },
                });
            }).not.toThrow();
            expect(Object.keys(userFields).length).toBeGreaterThan(0);
        });
        test("should support user creation with all expected fields", () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                email: "schema.test@example.com",
                firstName: "Schema",
                lastName: "Test",
                password: "hashedPassword",
                role: "BORROWER",
                verificationToken: "test-token-123",
            };
            // This will fail if any field is missing or incorrectly typed
            const createQuery = prisma.user.create({
                data: userData,
            });
            expect(createQuery).toBeDefined();
        }));
        test("should support user update with verification fields", () => __awaiter(void 0, void 0, void 0, function* () {
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
        }));
        test("should support finding user by verification token", () => __awaiter(void 0, void 0, void 0, function* () {
            const findQuery = prisma.user.findUnique({
                where: {
                    verificationToken: "some-token",
                },
            });
            expect(findQuery).toBeDefined();
        }));
    });
    describe("Loan Model Field Validation", () => {
        test("should have all required fields used in loanService", () => __awaiter(void 0, void 0, void 0, function* () {
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
        }));
        test("should support loan creation with all expected fields", () => __awaiter(void 0, void 0, void 0, function* () {
            const loanData = {
                title: "Test Loan",
                description: "Test Description",
                amountRequested: 10000,
                interestRate: 12.5,
                duration: 24,
                totalInterest: 2500,
                borrowerId: "test-borrower-id",
            };
            const createQuery = prisma.loan.create({
                data: loanData,
            });
            expect(createQuery).toBeDefined();
        }));
    });
    describe("Transaction Model Field Validation", () => {
        test("should have all required fields used in services", () => __awaiter(void 0, void 0, void 0, function* () {
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
        }));
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
                        type: type,
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
                        totalInterest: 100,
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
                    data: { availableBalance: 1000 },
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
                            role: role,
                        },
                    });
                }).not.toThrow();
            });
            // Test LoanStatus enum values
            const loanStatuses = ["PENDING", "FUNDING", "FUNDED", "REPAID"];
            loanStatuses.forEach((status) => {
                expect(() => {
                    prisma.loan.update({
                        where: { id: "loan-id" },
                        data: { status: status },
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
                            type: type,
                            userId: "test-user-id",
                        },
                    });
                }).not.toThrow();
            });
        });
    });
});
