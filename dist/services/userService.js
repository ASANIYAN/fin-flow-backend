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
exports.updateUserProfileService = exports.getUserProfileService = exports.resetUserPassword = exports.generatePasswordResetToken = exports.comparePasswords = exports.findUserById = exports.findUserByEmail = exports.verifyUser = exports.findUserByVerificationToken = exports.createUser = exports.prisma = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../lib/prisma");
const prisma = new prisma_1.PrismaClient();
exports.prisma = prisma;
const saltRounds = 10;
const createUser = (email, password, firstName, lastName, role) => __awaiter(void 0, void 0, void 0, function* () {
    const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
    const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
    return prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role,
            verificationToken,
        },
    });
});
exports.createUser = createUser;
const findUserByVerificationToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.user.findUnique({
        where: {
            verificationToken: token,
        },
    });
});
exports.findUserByVerificationToken = findUserByVerificationToken;
const verifyUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            verificationToken: null, // Remove the token after successful verification
        },
    });
});
exports.verifyUser = verifyUser;
const findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.user.findUnique({
        where: {
            email,
        },
    });
});
exports.findUserByEmail = findUserByEmail;
const findUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.user.findUnique({
        where: {
            id,
        },
    });
});
exports.findUserById = findUserById;
const comparePasswords = (password, hashedPassword) => __awaiter(void 0, void 0, void 0, function* () {
    return bcrypt_1.default.compare(password, hashedPassword);
});
exports.comparePasswords = comparePasswords;
const generatePasswordResetToken = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield (0, exports.findUserByEmail)(email);
    // Security best practice: Do not reveal if the user exists or not
    if (!user) {
        return null;
    }
    // Generate a secure, URL-safe token
    const resetToken = crypto_1.default.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
    yield prisma.user.update({
        where: { id: user.id },
        data: {
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetTokenExpires,
        },
    });
    return resetToken;
});
exports.generatePasswordResetToken = generatePasswordResetToken;
const resetUserPassword = (token, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const hashedPassword = yield bcrypt_1.default.hash(newPassword, saltRounds);
    const user = yield prisma.user.findFirst({
        where: {
            resetPasswordToken: token,
            resetPasswordExpires: { gt: new Date() }, // Check if token has not expired
        },
    });
    if (!user) {
        return null;
    }
    yield prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetPasswordToken: null, // Invalidate the token
            resetPasswordExpires: null,
        },
    });
    return user;
});
exports.resetUserPassword = resetUserPassword;
const getUserProfileService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma.user.findUnique({
        where: {
            id: userId,
        },
        // We only want to select non-sensitive fields for the public profile
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isEmailVerified: true,
            createdAt: true,
        },
    });
    return user;
});
exports.getUserProfileService = getUserProfileService;
const updateUserProfileService = (userId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    // You should validate updateData here to ensure a user can only update
    // specific fields (e.g., firstName, lastName) and not sensitive ones like
    // email or password without proper verification.
    const validUpdateFields = {};
    if (updateData.firstName)
        validUpdateFields.firstName = updateData.firstName;
    if (updateData.lastName)
        validUpdateFields.lastName = updateData.lastName;
    // We should also check for an empty object to avoid unnecessary database calls
    if (Object.keys(validUpdateFields).length === 0) {
        throw new Error("No valid fields provided for update.");
    }
    const updatedUser = yield prisma.user.update({
        where: {
            id: userId,
        },
        data: validUpdateFields,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isEmailVerified: true,
            createdAt: true,
        },
    });
    return updatedUser;
});
exports.updateUserProfileService = updateUserProfileService;
