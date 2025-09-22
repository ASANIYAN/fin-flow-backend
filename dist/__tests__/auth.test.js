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
describe("Authentication Endpoints", () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up test data before each test
        yield userService_1.prisma.user.deleteMany({});
        // Wait a bit to ensure cleanup is complete
        yield new Promise((resolve) => setTimeout(resolve, 100));
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield userService_1.prisma.$disconnect();
    }));
    it("should sign up a new user successfully", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.default).post("/api/auth/signup").send({
            email: "testuser@example.com",
            password: "Password123!",
            confirmPassword: "Password123!",
            firstName: "Test",
            lastName: "User",
            role: "BORROWER",
        });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty("data");
        expect(res.body.data).toHaveProperty("email", "testuser@example.com");
        expect(res.body.data).toHaveProperty("firstName", "Test");
        expect(res.body.data).toHaveProperty("lastName", "User");
    }));
    it("should not allow signup with a duplicate email", () => __awaiter(void 0, void 0, void 0, function* () {
        // First create a user
        yield (0, supertest_1.default)(server_1.default).post("/api/auth/signup").send({
            email: "testuser@example.com",
            password: "Password123!",
            confirmPassword: "Password123!",
            firstName: "First",
            lastName: "User",
            role: "BORROWER",
        });
        // Then try to create another user with the same email
        const res = yield (0, supertest_1.default)(server_1.default).post("/api/auth/signup").send({
            email: "testuser@example.com",
            password: "Password123!",
            confirmPassword: "Password123!",
            firstName: "Duplicate",
            lastName: "User",
            role: "LENDER",
        });
        expect(res.statusCode).toEqual(409);
        expect(res.body).toHaveProperty("error", "Email already in use");
    }));
    it("should log in a user successfully", () => __awaiter(void 0, void 0, void 0, function* () {
        // First create a user
        yield (0, supertest_1.default)(server_1.default).post("/api/auth/signup").send({
            email: "logintest@example.com",
            password: "Password123!",
            confirmPassword: "Password123!",
            firstName: "Login",
            lastName: "Test",
            role: "BORROWER",
        });
        // Manually verify the user's email for testing
        const user = yield userService_1.prisma.user.findUnique({
            where: { email: "logintest@example.com" },
        });
        if (user) {
            yield userService_1.prisma.user.update({
                where: { id: user.id },
                data: { isEmailVerified: true },
            });
        }
        // Then try to log in
        const res = yield (0, supertest_1.default)(server_1.default).post("/api/auth/login").send({
            email: "logintest@example.com",
            password: "Password123!",
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("data");
        expect(res.body.data).toHaveProperty("token");
    }));
    it("should not log in a user with an invalid password", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.default).post("/api/auth/login").send({
            email: "logintest@example.com",
            password: "wrong_password",
        });
        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty("error", "Invalid email or password");
    }));
    it("should not allow login with unverified email", () => __awaiter(void 0, void 0, void 0, function* () {
        // Create a user but don't verify email
        yield (0, supertest_1.default)(server_1.default).post("/api/auth/signup").send({
            email: "unverified@example.com",
            password: "Password123!",
            confirmPassword: "Password123!",
            firstName: "Unverified",
            lastName: "User",
            role: "BORROWER",
        });
        // Try to log in with correct credentials but unverified email
        const res = yield (0, supertest_1.default)(server_1.default).post("/api/auth/login").send({
            email: "unverified@example.com",
            password: "Password123!",
        });
        expect(res.statusCode).toEqual(403);
        expect(res.body).toHaveProperty("error", "Please verify your email address before logging in");
    }));
});
