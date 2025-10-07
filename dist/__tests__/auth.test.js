"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NODE_ENV = "test";
process.env.TEST_DATABASE_URL = "file:./test.db";
const server_1 = __importDefault(require("../server"));
const supertest_1 = __importDefault(require("supertest"));
const userService_1 = require("../services/userService");
describe("Authentication Endpoints", () => {
    beforeEach(async () => {
        // Clean up test data before each test (order matters for foreign keys)
        await userService_1.prisma.transaction.deleteMany({});
        await userService_1.prisma.loan.deleteMany({});
        await userService_1.prisma.user.deleteMany({});
        // Wait a bit to ensure cleanup is complete
        await new Promise((resolve) => setTimeout(resolve, 100));
    });
    afterAll(async () => {
        await userService_1.prisma.$disconnect();
    });
    it("should sign up a new user successfully", async () => {
        const res = await (0, supertest_1.default)(server_1.default).post("/api/auth/signup").send({
            email: "testfostogokka@necub.com",
            password: "Fostogokka123#&",
            confirmPassword: "Fostogokka123#&",
            firstName: "Test",
            lastName: "User",
            role: "BORROWER",
        });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty("data");
        expect(res.body.data).toHaveProperty("email", "testfostogokka@necub.com");
        expect(res.body.data).toHaveProperty("firstName", "Test");
        expect(res.body.data).toHaveProperty("lastName", "User");
    });
    it("should not allow signup with a duplicate email", async () => {
        // First create a user
        await (0, supertest_1.default)(server_1.default).post("/api/auth/signup").send({
            email: "testfostogokka@necub.com",
            password: "Fostogokka123#&",
            confirmPassword: "Fostogokka123#&",
            firstName: "First",
            lastName: "User",
            role: "BORROWER",
        });
        // Then try to create another user with the same email
        const res = await (0, supertest_1.default)(server_1.default).post("/api/auth/signup").send({
            email: "testfostogokka@necub.com",
            password: "Fostogokka123#&",
            confirmPassword: "Fostogokka123#&",
            firstName: "Duplicate",
            lastName: "User",
            role: "LENDER",
        });
        expect(res.statusCode).toEqual(409);
        expect(res.body).toHaveProperty("error", "Email already in use");
    });
    it("should log in a user successfully", async () => {
        // First create a user
        await (0, supertest_1.default)(server_1.default).post("/api/auth/signup").send({
            email: "logintest@example.com",
            password: "Fostogokka123#&",
            confirmPassword: "Fostogokka123#&",
            firstName: "Login",
            lastName: "Test",
            role: "BORROWER",
        });
        // Manually verify the user's email for testing
        const user = await userService_1.prisma.user.findUnique({
            where: { email: "logintest@example.com" },
        });
        if (user) {
            await userService_1.prisma.user.update({
                where: { id: user.id },
                data: { isEmailVerified: true },
            });
        }
        // Then try to log in
        const res = await (0, supertest_1.default)(server_1.default).post("/api/auth/login").send({
            email: "logintest@example.com",
            password: "Fostogokka123#&",
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("data");
        expect(res.body.data).toHaveProperty("token");
    });
    it("should not log in a user with an invalid password", async () => {
        const res = await (0, supertest_1.default)(server_1.default).post("/api/auth/login").send({
            email: "logintest@example.com",
            password: "wrong_password",
        });
        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty("error", "Invalid email or password");
    });
    it("should not allow login with unverified email", async () => {
        // Create a user but don't verify email
        await (0, supertest_1.default)(server_1.default).post("/api/auth/signup").send({
            email: "unverified@example.com",
            password: "Fostogokka123#&",
            confirmPassword: "Fostogokka123#&",
            firstName: "Unverified",
            lastName: "User",
            role: "BORROWER",
        });
        // Try to log in with correct credentials but unverified email
        const res = await (0, supertest_1.default)(server_1.default).post("/api/auth/login").send({
            email: "unverified@example.com",
            password: "Fostogokka123#&",
        });
        expect(res.statusCode).toEqual(403);
        expect(res.body).toHaveProperty("error", "Please verify your email address before logging in");
    });
});
