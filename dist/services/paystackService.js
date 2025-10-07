"use strict";
// src/services/paystackService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAccountNameService = exports.listBanks = exports.verifyTransaction = void 0;
const axios_1 = __importDefault(require("axios"));
const loanService_1 = require("./loanService");
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_BASE_URL = "https://api.paystack.co";
if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY environment variable is required.");
}
const verifyTransaction = async (reference) => {
    try {
        const response = await axios_1.default.get(`${PAYSTACK_API_BASE_URL}/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });
        const data = response.data.data;
        // Check if the transaction was successful
        if (data.status === "success") {
            const amount = data.amount / 100; // Paystack returns amount in kobo/cents
            const lenderId = data.metadata.custom_fields[0].lender_id;
            const loanId = data.metadata.custom_fields[0].loan_id;
            await (0, loanService_1.fundLoanService)(loanId, lenderId, amount);
        }
        else {
            throw new Error(`Transaction ${reference} was not successful.`);
        }
    }
    catch (error) {
        // Paystack verification error
        throw new Error("Failed to verify transaction with Paystack.");
    }
};
exports.verifyTransaction = verifyTransaction;
const listBanks = async () => {
    try {
        const response = await axios_1.default.get(`${PAYSTACK_API_BASE_URL}/bank`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });
        // Return only the essential bank details
        return response.data.data.map((bank) => ({
            name: bank.name,
            code: bank.code,
        }));
    }
    catch (error) {
        // Error listing banks from Paystack
        throw new Error("Failed to retrieve bank list.");
    }
};
exports.listBanks = listBanks;
/**
 * Resolves a bank account number and bank code to retrieve the account holder's name.
 * * @param accountNumber The 10-digit account number.
 * @param bankCode The unique code for the bank (e.g., 044 for Access Bank).
 * @returns An object containing the account name and number.
 */
const resolveAccountNameService = async (accountNumber, bankCode) => {
    if (!PAYSTACK_SECRET_KEY) {
        throw new Error("Paystack Secret Key is not configured.");
    }
    try {
        // 1. Construct the URL with query parameters
        const url = `${PAYSTACK_API_BASE_URL}/bank/resolve`;
        const response = await axios_1.default.get(url, {
            params: {
                account_number: accountNumber,
                bank_code: "001",
            },
            headers: {
                // CRITICAL: Must use the Secret Key for this operation
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });
        const data = response.data;
        if (data.status !== true) {
            // This handles cases where the API returns a 200 OK but status: false
            throw new Error(data.message || "Failed to resolve account name.");
        }
        // 2. Return the necessary data
        return {
            account_number: data.data.account_number,
            account_name: data.data.account_name,
            bank_id: data.data.bank_id,
        };
    }
    catch (error) {
        // Paystack Account Resolution Error
        // Handle specific Paystack errors (e.g., invalid account number)
        if (axios_1.default.isAxiosError(error) && error.response?.data?.message) {
            throw new Error(`Resolution failed: ${error.response.data.message}`);
        }
        throw new Error("An unexpected error occurred during account resolution.");
    }
};
exports.resolveAccountNameService = resolveAccountNameService;
