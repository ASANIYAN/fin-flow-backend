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
exports.withdrawFundsService = exports.depositFundsService = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = require("../lib/prisma");
const userService_1 = require("./userService");
const prisma = new prisma_1.PrismaClient();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const depositFundsService = (userId, amount, reference) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
        // 1. Verify the transaction with Paystack (critical step)
        const response = yield axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });
        const data = response.data.data;
        if (data.status !== "success" || data.amount / 100 !== amount) {
            throw new Error("Transaction verification failed or amount mismatch.");
        }
        // 2. Check if the deposit has already been processed to prevent double-spending
        const existingTransaction = yield prisma.transaction.findFirst({
            where: {
                description: `Deposit via Paystack, Ref: ${reference}`,
                userId: userId,
            },
        });
        if (existingTransaction) {
            throw new Error("This transaction has already been processed.");
        }
        // 3. Update the user's wallet balance
        const user = yield prisma.user.findUnique({ where: { id: userId } });
        const newBalance = ((user === null || user === void 0 ? void 0 : user.balance.toNumber()) || 0) + amount;
        yield prisma.user.update({
            where: { id: userId },
            data: { balance: newBalance },
        });
        // 4. Create a transaction record
        yield prisma.transaction.create({
            data: {
                userId: userId,
                amount: amount,
                type: "DEPOSIT",
                description: `Deposit via Paystack, Ref: ${reference}`,
            },
        });
    }));
});
exports.depositFundsService = depositFundsService;
const createTransferRecipient = (name, accountNumber, bankCode) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.post(`https://api.paystack.co/transferrecipient`, {
        type: "nuban",
        name: name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
    }, {
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
    });
    return response.data.data.recipient_code;
});
// New function to initiate a transfer with Paystack
const initiateTransfer = (amount, recipientCode) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.post(`https://api.paystack.co/transfer`, {
        source: "balance",
        amount: amount * 100, // Paystack uses kobo
        recipient: recipientCode,
        reason: "Withdrawal from P2P lending platform",
    }, {
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
    });
    return response.data.data.reference;
});
const withdrawFundsService = (userId, amount, accountNumber, bankCode) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, userService_1.findUserById)(userId);
        if (!user || user.balance.toNumber() < amount) {
            throw new Error("Insufficient funds in wallet.");
        }
        // 1. Create a transfer recipient with Paystack
        const recipientCode = yield createTransferRecipient(`${user.firstName} ${user.lastName}`, accountNumber, bankCode);
        // 2. Debit the user's wallet
        const newBalance = user.balance.toNumber() - amount;
        yield prisma.user.update({
            where: { id: userId },
            data: { balance: newBalance },
        });
        // 3. Initiate the transfer with Paystack
        const transferReference = yield initiateTransfer(amount, recipientCode);
        // 4. Create a transaction record
        yield prisma.transaction.create({
            data: {
                userId: userId,
                amount: amount,
                type: prisma_1.TransactionType.WITHDRAWAL,
                description: `Withdrawal, Ref: ${transferReference}`,
            },
        });
        return { message: "Withdrawal initiated successfully." };
    }));
});
exports.withdrawFundsService = withdrawFundsService;
