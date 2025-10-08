"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserTransactionsService = exports.updateUserProfileService = exports.getUserProfileService = exports.resetUserPassword = exports.generatePasswordResetToken = exports.comparePasswords = exports.findUserById = exports.findUserByEmail = exports.verifyUser = exports.findUserByVerificationToken = exports.createUser = exports.prisma = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
const saltRounds = 10;
const createUser = async (email, password, firstName, lastName) => {
    const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
    const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
    return prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            verificationToken,
        },
    });
};
exports.createUser = createUser;
const findUserByVerificationToken = async (token) => {
    return prisma.user.findUnique({
        where: {
            verificationToken: token,
        },
    });
};
exports.findUserByVerificationToken = findUserByVerificationToken;
const verifyUser = async (userId) => {
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
};
exports.verifyUser = verifyUser;
const findUserByEmail = async (email) => {
    return prisma.user.findUnique({
        where: {
            email,
        },
    });
};
exports.findUserByEmail = findUserByEmail;
const findUserById = async (id) => {
    return prisma.user.findUnique({
        where: {
            id,
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            password: true,
            isEmailVerified: true,
            emailVerifiedAt: true,
            verificationToken: true,
            availableBalance: true,
            escrowBalance: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};
exports.findUserById = findUserById;
const comparePasswords = async (password, hashedPassword) => {
    return bcrypt_1.default.compare(password, hashedPassword);
};
exports.comparePasswords = comparePasswords;
const generatePasswordResetToken = async (email) => {
    const user = await (0, exports.findUserByEmail)(email);
    // Security best practice: Do not reveal if the user exists or not
    if (!user) {
        return null;
    }
    // Generate a secure, URL-safe token
    const resetToken = crypto_1.default.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetTokenExpires,
        },
    });
    return resetToken;
};
exports.generatePasswordResetToken = generatePasswordResetToken;
const resetUserPassword = async (token, newPassword) => {
    const hashedPassword = await bcrypt_1.default.hash(newPassword, saltRounds);
    const user = await prisma.user.findFirst({
        where: {
            resetPasswordToken: token,
            resetPasswordExpires: { gt: new Date() }, // Check if token has not expired
        },
    });
    if (!user) {
        return null;
    }
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetPasswordToken: null, // Invalidate the token
            resetPasswordExpires: null,
        },
    });
    return user;
};
exports.resetUserPassword = resetUserPassword;
const getUserProfileService = async (userId) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        // We only want to select non-sensitive fields for the public profile
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isEmailVerified: true,
            availableBalance: true,
            escrowBalance: true,
            createdAt: true,
        },
    });
    return {
        ...user,
        availableBalance: parseFloat((user?.availableBalance ?? "0").toString()),
        escrowBalance: parseFloat((user?.escrowBalance ?? "0").toString()),
    };
};
exports.getUserProfileService = getUserProfileService;
const updateUserProfileService = async (userId, updateData) => {
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
    const updatedUser = await prisma.user.update({
        where: {
            id: userId,
        },
        data: validUpdateFields,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isEmailVerified: true,
            createdAt: true,
        },
    });
    return updatedUser;
};
exports.updateUserProfileService = updateUserProfileService;
const getUserTransactionsService = async (userId, page = 1, pageSize = 10, q) => {
    // Calculate skip for pagination
    const skip = (page - 1) * pageSize;
    // Build the dynamic 'where' clause for filtering and searching
    const where = {
        userId: userId,
    };
    if (q) {
        const searchTermUpper = q.toUpperCase();
        const orConditions = [{ description: { contains: q } }];
        // Only add type/status filters if the search term matches valid enum values
        const validTypes = [
            "DEPOSIT",
            "WITHDRAWAL",
            "LOAN_FUNDING",
            "LOAN_REPAYMENT",
        ];
        const validStatuses = ["PENDING", "REPAID", "FAILED"];
        if (validTypes.includes(searchTermUpper)) {
            orConditions.push({ type: { equals: searchTermUpper } });
        }
        if (validStatuses.includes(searchTermUpper)) {
            orConditions.push({ status: { equals: searchTermUpper } });
        }
        // Add loan title search if available
        orConditions.push({ loan: { title: { contains: q } } });
        where.OR = orConditions;
    }
    // Fetch the paginated and filtered transactions
    const transactions = await prisma.transaction.findMany({
        where,
        skip,
        take: pageSize,
        // We can also include related data for better context in the response
        include: {
            loan: {
                select: {
                    title: true, // Only include the loan title for context
                },
            },
        },
        orderBy: {
            createdAt: "desc", // Sort by most recent transactions first
        },
    });
    // Get the total count of transactions for pagination (without skip/take)
    const totalCount = await prisma.transaction.count({ where });
    const totalPages = Math.ceil(totalCount / pageSize);
    return { transactions, totalCount, totalPages };
};
exports.getUserTransactionsService = getUserTransactionsService;
