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
exports.getBanks = exports.handleWebhook = void 0;
const crypto_1 = __importDefault(require("crypto"));
const paystackService_1 = require("../services/paystackService");
const message_1 = require("../utils/message");
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
// Ensure the secret key is available at startup
if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY environment variable is not set.");
}
const handleWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = req.headers["x-paystack-signature"];
    // 1. Check for the signature header
    if (!hash) {
        return (0, message_1.errorResponse)(res, 400, "Missing webhook signature.");
    }
    // 2. Compute the hash from the request body and secret key
    const expectedHash = crypto_1.default
        .createHmac("sha512", PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest("hex");
    // 3. Compare the computed hash with the signature from the header
    if (expectedHash !== hash) {
        // Log the error for monitoring but don't expose sensitive info
        console.warn("Paystack webhook signature mismatch detected.");
        return (0, message_1.errorResponse)(res, 403, "Invalid signature.");
    }
    // Signature is valid, so now we can trust the event
    const event = req.body;
    if (event.event === "charge.success") {
        const reference = event.data.reference;
        try {
            yield (0, paystackService_1.verifyTransaction)(reference);
            // It's important to return a 200 OK to acknowledge receipt of the event
            return (0, message_1.successResponse)(res, 200, "Webhook processed successfully.");
        }
        catch (error) {
            console.error("Error verifying transaction:", error);
            // Return a non-success code to signal an issue to Paystack for retries
            return (0, message_1.errorResponse)(res, 500, "Failed to process transaction.");
        }
    }
    // Handle other webhook events if necessary
    // Acknowledge receipt of the event even if it's not a 'charge.success'
    return (0, message_1.successResponse)(res, 200, "Event received, no action taken.");
});
exports.handleWebhook = handleWebhook;
const getBanks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const banks = yield (0, paystackService_1.listBanks)();
        return (0, message_1.successResponse)(res, 200, "Bank list fetched successfully.", banks);
    }
    catch (error) {
        console.error("Error fetching banks:", error);
        return (0, message_1.errorResponse)(res, 500, "Unable to fetch bank list.");
    }
});
exports.getBanks = getBanks;
