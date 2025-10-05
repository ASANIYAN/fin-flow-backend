// src/services/paystackService.ts

import axios from "axios";
import { fundLoanService } from "./loanService";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY as string;

if (!PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY environment variable is required.");
}

export const verifyTransaction = async (reference: string) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = response.data.data;

    // Check if the transaction was successful
    if (data.status === "success") {
      const amount = data.amount / 100; // Paystack returns amount in kobo/cents
      const lenderId = data.metadata.custom_fields[0].lender_id;
      const loanId = data.metadata.custom_fields[0].loan_id;

      await fundLoanService(loanId, lenderId, amount);
    } else {
      throw new Error(`Transaction ${reference} was not successful.`);
    }
  } catch (error) {
    // Paystack verification error
    throw new Error("Failed to verify transaction with Paystack.");
  }
};

export const listBanks = async () => {
  try {
    const response = await axios.get(`https://api.paystack.co/bank`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });
    // Return only the essential bank details
    return response.data.data.map((bank: any) => ({
      name: bank.name,
      code: bank.code,
    }));
  } catch (error) {
    // Error listing banks from Paystack
    throw new Error("Failed to retrieve bank list.");
  }
};
