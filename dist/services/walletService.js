"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawFundsService = exports.confirmDepositAttemptService = exports.processVerifiedDeposit = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const client_2 = require("../../node_modules/.prisma/client");
const userService_1 = require("./userService");
const utils_1 = require("../utils/utils");
const prisma = new client_1.PrismaClient();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
/**
 * Executes the secure balance update and transaction logging.
 * This function is designed to be idempotent and is called by both
 * the Webhook and the client-side path (after verification).
 * * @param reference The unique Paystack transaction reference.
 * @param verifiedAmount The amount confirmed by Paystack (in your currency unit).
 * @param userId The ID of the user to credit.
 * @param externalRef The reference from Paystack.
 */
const processVerifiedDeposit = async (userId, verifiedAmount, reference) => {
    return prisma.$transaction(async (tx) => {
        // 1. Check if the deposit has already been processed by externalRef (unique index)
        const existingTransaction = await tx.transaction.findUnique({
            where: {
                externalRef: reference,
            },
        });
        if (existingTransaction) {
            // If processed, treat as success but prevent double-crediting (idempotency)
            // Idempotency: transaction already processed
            return;
        }
        // 2. Update the user's wallet balance
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { availableBalance: true },
        });
        if (!user) {
            throw new Error("User not found during deposit processing.");
        }
        const newBalance = user.availableBalance.toNumber() + verifiedAmount;
        await tx.user.update({
            where: { id: userId },
            data: { availableBalance: newBalance },
        });
        // 3. Create a transaction record with the unique external reference
        await tx.transaction.create({
            data: {
                userId: userId,
                amount: verifiedAmount,
                type: "DEPOSIT",
                description: `Deposit via Paystack, Ref: ${reference}`,
                externalRef: reference, // Save the unique external reference
            },
        });
    });
};
exports.processVerifiedDeposit = processVerifiedDeposit;
/**
 * * Handles the server-side verification request initiated by the frontend callback.
 * This ONLY confirms the payment status and logs the intent, it does NOT update the balance.
 */
const confirmDepositAttemptService = async (userId, amount, reference) => {
    // First check if this reference has already been processed
    const existingTransaction = await prisma.transaction.findUnique({
        where: {
            externalRef: reference,
        },
    });
    if (existingTransaction) {
        throw new Error("Transaction reference has already been processed");
    }
    const MAX_RETRIES = 3; // Maximum attempts
    let currentRetry = 0;
    while (currentRetry < MAX_RETRIES) {
        try {
            // 1. Verify the transaction with Paystack (critical step)
            const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            });
            // Paystack response received
            const data = response.data.data;
            // Convert amount from Kobo/Cents to currency unit for comparison
            // Paystack returns amount in the smallest denomination (kobo/cents).
            const verifiedAmount = data.amount / 100;
            // Check transaction status and amount
            if (data.status !== "success" || verifiedAmount !== amount) {
                // If status is 'pending', we exit the loop and rely on the webhook.
                // If status is 'failed' or amount is wrong, we throw.
                throw new Error(`Verification failed: Status is '${data.status}' or amount mismatch (${verifiedAmount} vs ${amount}).`);
            }
            // If verification is successful, return success
            // Client-side confirmation verified for reference
            return {
                success: true,
                message: "Payment confirmed. Balance update pending via webhook.",
            };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) &&
                error.response?.status === 400 &&
                error.response?.data?.code === "transaction_not_found") {
                // Only retry if it's the specific "Transaction reference not found" error
                currentRetry++;
                const delay = Math.pow(2, currentRetry) * 500; // Exponential backoff: 1s, 2s, 4s...
                // Paystack reference not found; will retry
                if (currentRetry < MAX_RETRIES) {
                    await (0, utils_1.sleep)(delay);
                    continue; // Go to the next retry attempt
                }
            }
            // If we run out of retries, or if it's a different error, throw the original error
            // Final error confirming deposit
            throw error;
        }
    }
    // Should only be reached if the loop finishes without success or final throw
    throw new Error("Failed to confirm deposit after multiple retries.");
};
exports.confirmDepositAttemptService = confirmDepositAttemptService;
const createTransferRecipient = async (name, accountNumber, bankCode) => {
    const response = await axios_1.default.post(`https://api.paystack.co/transferrecipient`, {
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
};
// New function to initiate a transfer with Paystack
const initiateTransfer = async (amount, recipientCode) => {
    const response = await axios_1.default.post(`https://api.paystack.co/transfer`, {
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
};
const withdrawFundsService = async (userId, amount, accountNumber, bankCode) => {
    return prisma.$transaction(async (prisma) => {
        const user = await (0, userService_1.findUserById)(userId);
        if (!user || user.availableBalance.toNumber() < amount) {
            throw new Error("Insufficient funds in wallet.");
        }
        // 1. Create a transfer recipient with Paystack
        const recipientCode = await createTransferRecipient(`${user.firstName} ${user.lastName}`, accountNumber, bankCode);
        // 2. Debit the user's wallet
        const newBalance = user.availableBalance.toNumber() - amount;
        await prisma.user.update({
            where: { id: userId },
            data: { availableBalance: newBalance },
        });
        // 3. Initiate the transfer with Paystack
        const transferReference = await initiateTransfer(amount, recipientCode);
        // 4. Create a transaction record
        await prisma.transaction.create({
            data: {
                userId: userId,
                amount: amount,
                type: client_2.TransactionType.WITHDRAWAL,
                description: `Withdrawal, Ref: ${transferReference}`,
            },
        });
        return { message: "Withdrawal initiated successfully." };
    });
};
exports.withdrawFundsService = withdrawFundsService;
