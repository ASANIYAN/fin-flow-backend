"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAccountName = exports.getBanks = exports.handleWebhook = void 0;
const crypto_1 = __importDefault(require("crypto"));
const paystackService_1 = require("../services/paystackService");
const message_1 = require("../utils/message");
const walletService_1 = require("../services/walletService");
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
// Ensure the secret key is available at startup
if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY environment variable is not set.");
}
// The endpoint called ONLY by Paystack's server
const handleWebhook = async (req, res) => {
    const hash = req.headers["x-paystack-signature"];
    // 1. Check for the signature header
    if (!hash) {
        return (0, message_1.errorResponse)(res, 400, "Missing webhook signature.");
    }
    // 2. Compute the hash from the request body and secret key
    // NOTE: Ensure req.body is the raw, unparsed buffer if your express config uses body-parser,
    // but JSON.stringify(req.body) works for most standard Express setups.
    const expectedHash = crypto_1.default
        .createHmac("sha512", PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest("hex");
    // 3. Compare the computed hash with the signature from the header
    if (expectedHash !== hash) {
        // Signature mismatch detected
        return (0, message_1.errorResponse)(res, 403, "Invalid signature.");
    }
    // Signature is valid, we trust the event
    const event = req.body;
    if (event.event === "charge.success") {
        try {
            // Use the already defined 'event' variable from above
            const reference = event.data?.reference;
            const amountInKobo = event.data?.amount;
            const metadata = event.data?.metadata;
            const userId = metadata?.userId;
            if (!reference || !amountInKobo || !userId) {
                // Malformed webhook data: missing reference, amount, or userId
                return (0, message_1.successResponse)(res, 200, "Webhook received but data incomplete.");
            }
            const verifiedAmount = amountInKobo / 100;
            // 4. Call the central processing function
            // NOTE: This assumes you added the userId to the Paystack metadata during the frontend call.
            await (0, walletService_1.processVerifiedDeposit)(userId, verifiedAmount, reference);
            // CRITICAL: Must return 200 OK to tell Paystack the event was handled.
            return (0, message_1.successResponse)(res, 200, "Webhook processed successfully.");
        }
        catch (error) {
            // Error processing transaction via webhook
            return (0, message_1.errorResponse)(res, 500, "Failed to process transaction.");
        }
    }
    // Acknowledge receipt of all other events (like 'transfer.success')
    return (0, message_1.successResponse)(res, 200, "Event received, no action taken.");
};
exports.handleWebhook = handleWebhook;
const getBanks = async (req, res) => {
    try {
        const banks = await (0, paystackService_1.listBanks)();
        return (0, message_1.successResponse)(res, 200, "Bank list fetched successfully.", banks);
    }
    catch (error) {
        // Error fetching banks
        return (0, message_1.errorResponse)(res, 500, "Unable to fetch bank list.");
    }
};
exports.getBanks = getBanks;
const resolveAccountName = async (req, res) => {
    const { accountNumber, bankCode } = req.body;
    if (!accountNumber || !bankCode) {
        return (0, message_1.errorResponse)(res, 400, "Both accountNumber and bankCode are required.");
    }
    try {
        const resolution = await (0, paystackService_1.resolveAccountNameService)(accountNumber, bankCode);
        return (0, message_1.successResponse)(res, 200, "Account resolved successfully.", {
            account_number: resolution.account_number,
            account_name: resolution.account_name,
            bank_id: resolution.bank_id,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        return (0, message_1.errorResponse)(res, 500, message);
    }
};
exports.resolveAccountName = resolveAccountName;
