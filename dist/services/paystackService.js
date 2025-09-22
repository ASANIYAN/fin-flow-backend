"use strict";
// src/services/paystackService.ts
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
exports.listBanks = exports.verifyTransaction = void 0;
const axios_1 = __importDefault(require("axios"));
const loanService_1 = require("./loanService");
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY environment variable is required.");
}
const verifyTransaction = (reference) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
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
            yield (0, loanService_1.fundLoanService)(loanId, lenderId, amount);
            console.log(`Successfully verified and funded loan ${loanId}`);
        }
        else {
            throw new Error(`Transaction ${reference} was not successful.`);
        }
    }
    catch (error) {
        console.error("Paystack verification error:", error);
        throw new Error("Failed to verify transaction with Paystack.");
    }
});
exports.verifyTransaction = verifyTransaction;
const listBanks = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get(`https://api.paystack.co/bank`, {
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
        console.error("Error listing banks from Paystack:", error);
        throw new Error("Failed to retrieve bank list.");
    }
});
exports.listBanks = listBanks;
