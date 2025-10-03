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
const crypto_1 = __importDefault(require("crypto"));
// Mock Paystack API calls
jest.mock("../services/paystackService", () => ({
    listBanks: jest.fn(() => Promise.resolve([
        {
            id: 1,
            name: "Access Bank",
            code: "044",
            longcode: "044150149",
            gateway: "emandate",
            pay_with_bank: false,
            active: true,
            country: "Nigeria",
            currency: "NGN",
            type: "nuban",
        },
        {
            id: 2,
            name: "Guaranty Trust Bank",
            code: "058",
            longcode: "058152036",
            gateway: "emandate",
            pay_with_bank: false,
            active: true,
            country: "Nigeria",
            currency: "NGN",
            type: "nuban",
        },
    ])),
    verifyTransaction: jest.fn((reference) => Promise.resolve({
        status: true,
        data: {
            id: 12345,
            reference: reference,
            amount: 1000000, // Amount in kobo (10,000 NGN)
            status: "success",
            customer: {
                email: "test@example.com",
            },
            metadata: {
                userId: "test-user-id",
            },
        },
    })),
}));
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "test_secret";
const createWebhookSignature = (payload) => {
    return crypto_1.default
        .createHmac("sha512", PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(payload))
        .digest("hex");
};
describe("Paystack Endpoints", () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up test data before each test (order matters for foreign keys)
        yield userService_1.prisma.transaction.deleteMany({});
        yield userService_1.prisma.loan.deleteMany({});
        yield userService_1.prisma.user.deleteMany({});
        // Wait a bit to ensure setup is complete
        yield new Promise((resolve) => setTimeout(resolve, 100));
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield userService_1.prisma.$disconnect();
    }));
    describe("GET /api/paystack/banks", () => {
        it("should return list of Nigerian banks", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server_1.default).get("/api/paystack/banks");
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("success", true);
            expect(res.body).toHaveProperty("data");
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
            // Check structure of bank object
            const bank = res.body.data[0];
            expect(bank).toHaveProperty("id");
            expect(bank).toHaveProperty("name");
            expect(bank).toHaveProperty("code");
            expect(bank).toHaveProperty("active");
            expect(bank).toHaveProperty("country");
            expect(bank).toHaveProperty("currency");
        }));
    });
    describe("POST /api/paystack/webhook", () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Create a test user for webhook processing
            yield userService_1.prisma.user.create({
                data: {
                    id: "test-user-id",
                    email: "webhook-user@test.com",
                    password: "hashedpassword",
                    firstName: "Webhook",
                    lastName: "User",
                    role: "LENDER",
                    isEmailVerified: true,
                    availableBalance: 0,
                    escrowBalance: 0,
                },
            });
        }));
        it("should process successful charge webhook", () => __awaiter(void 0, void 0, void 0, function* () {
            const webhookPayload = {
                event: "charge.success",
                data: {
                    id: 12345,
                    reference: "ref_webhook_test",
                    amount: 1000000, // 10,000 NGN in kobo
                    status: "success",
                    customer: {
                        email: "webhook-user@test.com",
                    },
                    metadata: {
                        userId: "test-user-id",
                    },
                },
            };
            const signature = createWebhookSignature(webhookPayload);
            const res = yield (0, supertest_1.default)(server_1.default)
                .post("/api/paystack/webhook")
                .set("x-paystack-signature", signature)
                .send(webhookPayload);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("success", true);
        }));
        it("should reject webhook without signature", () => __awaiter(void 0, void 0, void 0, function* () {
            const webhookPayload = {
                event: "charge.success",
                data: {
                    reference: "ref_no_signature",
                },
            };
            const res = yield (0, supertest_1.default)(server_1.default)
                .post("/api/paystack/webhook")
                .send(webhookPayload);
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("success", false);
            expect(res.body.message).toContain("Missing webhook signature");
        }));
        it("should reject webhook with invalid signature", () => __awaiter(void 0, void 0, void 0, function* () {
            const webhookPayload = {
                event: "charge.success",
                data: {
                    reference: "ref_invalid_signature",
                },
            };
            const invalidSignature = "invalid_signature_hash";
            const res = yield (0, supertest_1.default)(server_1.default)
                .post("/api/paystack/webhook")
                .set("x-paystack-signature", invalidSignature)
                .send(webhookPayload);
            expect(res.statusCode).toEqual(403);
            expect(res.body).toHaveProperty("success", false);
        }));
        it("should handle transfer success webhook", () => __awaiter(void 0, void 0, void 0, function* () {
            const webhookPayload = {
                event: "transfer.success",
                data: {
                    reference: "ref_transfer_test",
                    amount: 500000, // 5,000 NGN in kobo
                    status: "success",
                    recipient: {
                        details: {
                            account_number: "0123456789",
                            bank_code: "058",
                        },
                    },
                    metadata: {
                        userId: "test-user-id",
                        type: "withdrawal",
                    },
                },
            };
            const signature = createWebhookSignature(webhookPayload);
            const res = yield (0, supertest_1.default)(server_1.default)
                .post("/api/paystack/webhook")
                .set("x-paystack-signature", signature)
                .send(webhookPayload);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("success", true);
        }));
        it("should handle transfer failed webhook", () => __awaiter(void 0, void 0, void 0, function* () {
            const webhookPayload = {
                event: "transfer.failed",
                data: {
                    reference: "ref_transfer_failed",
                    amount: 500000,
                    status: "failed",
                    recipient: {
                        details: {
                            account_number: "0123456789",
                            bank_code: "058",
                        },
                    },
                    metadata: {
                        userId: "test-user-id",
                        type: "withdrawal",
                    },
                },
            };
            const signature = createWebhookSignature(webhookPayload);
            const res = yield (0, supertest_1.default)(server_1.default)
                .post("/api/paystack/webhook")
                .set("x-paystack-signature", signature)
                .send(webhookPayload);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("success", true);
        }));
        it("should ignore unknown webhook events", () => __awaiter(void 0, void 0, void 0, function* () {
            const webhookPayload = {
                event: "unknown.event",
                data: {
                    reference: "ref_unknown_event",
                },
            };
            const signature = createWebhookSignature(webhookPayload);
            const res = yield (0, supertest_1.default)(server_1.default)
                .post("/api/paystack/webhook")
                .set("x-paystack-signature", signature)
                .send(webhookPayload);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("success", true);
            expect(res.body.message).toContain("Event received, no action taken.");
        }));
        it("should handle malformed webhook data", () => __awaiter(void 0, void 0, void 0, function* () {
            const malformedPayload = {
                // Missing required fields
                event: "charge.success",
            };
            const signature = createWebhookSignature(malformedPayload);
            const res = yield (0, supertest_1.default)(server_1.default)
                .post("/api/paystack/webhook")
                .set("x-paystack-signature", signature)
                .send(malformedPayload);
            // Should return 200 for malformed data (webhook still processed successfully)
            expect(res.statusCode).toEqual(200);
        }));
    });
    describe("Webhook Security", () => {
        it("should handle multiple signature formats", () => __awaiter(void 0, void 0, void 0, function* () {
            const webhookPayload = {
                event: "charge.success",
                data: {
                    reference: "ref_signature_test",
                },
            };
            const signature = createWebhookSignature(webhookPayload);
            // Test with various signature formats that might be sent
            const formats = [
                signature,
                signature.toLowerCase(),
                signature.toUpperCase(),
            ];
            for (const sig of formats) {
                const res = yield (0, supertest_1.default)(server_1.default)
                    .post("/api/paystack/webhook")
                    .set("x-paystack-signature", sig)
                    .send(webhookPayload);
                // Only the exact signature should work
                if (sig === signature) {
                    expect(res.statusCode).toEqual(200);
                }
                else {
                    expect(res.statusCode).toEqual(403);
                }
            }
        }));
        it("should handle empty payload", () => __awaiter(void 0, void 0, void 0, function* () {
            const emptyPayload = {};
            const signature = createWebhookSignature(emptyPayload);
            const res = yield (0, supertest_1.default)(server_1.default)
                .post("/api/paystack/webhook")
                .set("x-paystack-signature", signature)
                .send(emptyPayload);
            expect(res.statusCode).toEqual(200);
        }));
        it("should handle very large payloads", () => __awaiter(void 0, void 0, void 0, function* () {
            const largePayload = {
                event: "charge.success",
                data: {
                    reference: "ref_large_payload",
                    metadata: {
                        // Create a large metadata object
                        largeData: "x".repeat(10000),
                    },
                },
            };
            const signature = createWebhookSignature(largePayload);
            const res = yield (0, supertest_1.default)(server_1.default)
                .post("/api/paystack/webhook")
                .set("x-paystack-signature", signature)
                .send(largePayload);
            expect(res.statusCode).toEqual(200);
        }));
    });
});
