// Ensure we use the test database
process.env.NODE_ENV = "test";
process.env.TEST_DATABASE_URL = "file:./test.db";

import app from "../server";
import request from "supertest";
import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

describe("Authentication Endpoints", () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should sign up a new user successfully", async () => {
    const res = await request(app).post("/api/auth/signup").send({
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
  });

  it("should not allow signup with a duplicate email", async () => {
    // First create a user
    await request(app).post("/api/auth/signup").send({
      email: "testuser@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      firstName: "First",
      lastName: "User",
      role: "BORROWER",
    });

    // Then try to create another user with the same email
    const res = await request(app).post("/api/auth/signup").send({
      email: "testuser@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      firstName: "Duplicate",
      lastName: "User",
      role: "LENDER",
    });
    expect(res.statusCode).toEqual(409);
    expect(res.body).toHaveProperty("error", "Email already in use");
  });

  it("should log in a user successfully", async () => {
    // First create a user
    await request(app).post("/api/auth/signup").send({
      email: "testuser@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      firstName: "Test",
      lastName: "User",
      role: "BORROWER",
    });

    // Then try to log in
    const res = await request(app).post("/api/auth/login").send({
      email: "testuser@example.com",
      password: "Password123!",
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("token");
  });

  it("should not log in a user with an invalid password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "testuser@example.com",
      password: "wrong_password",
    });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("error", "Invalid email or password");
  });
});
