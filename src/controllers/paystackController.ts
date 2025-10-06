import { Request, Response } from "express";
import crypto from "crypto";
import {
  listBanks,
  verifyTransaction,
  resolveAccountNameService,
} from "../services/paystackService";
import { errorResponse, successResponse } from "../utils/message";
import { processVerifiedDeposit } from "../services/walletService";
import { AuthenticatedRequest } from "../types/auth";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY as string;

// Ensure the secret key is available at startup
if (!PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY environment variable is not set.");
}

// The endpoint called ONLY by Paystack's server
export const handleWebhook = async (req: Request, res: Response) => {
  const hash = req.headers["x-paystack-signature"] as string;

  // 1. Check for the signature header
  if (!hash) {
    return errorResponse(res, 400, "Missing webhook signature.");
  }

  // 2. Compute the hash from the request body and secret key
  // NOTE: Ensure req.body is the raw, unparsed buffer if your express config uses body-parser,
  // but JSON.stringify(req.body) works for most standard Express setups.
  const expectedHash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  // 3. Compare the computed hash with the signature from the header
  if (expectedHash !== hash) {
    // Signature mismatch detected
    return errorResponse(res, 403, "Invalid signature.");
  }

  // Signature is valid, we trust the event
  const event = req.body;

  if (event.event === "charge.success") {
    try {
      // Type definitions for Paystack webhook event
      interface PaystackCustomField {
        display_name: string;
        variable_name: string;
        value: string;
      }

      interface PaystackMetadata {
        custom_fields?: PaystackCustomField[];
        [key: string]: any;
      }

      interface PaystackEventData {
        reference?: string;
        amount?: number;
        metadata?: PaystackMetadata;
        [key: string]: any;
      }

      // Use the already defined 'event' variable from above
      const reference = event.data?.reference;
      const amountInKobo = event.data?.amount;
      const metadata = event.data?.metadata;
      const userId: string | undefined = metadata?.userId;

      if (!reference || !amountInKobo || !userId) {
        // Malformed webhook data: missing reference, amount, or userId
        return successResponse(
          res,
          200,
          "Webhook received but data incomplete."
        );
      }

      const verifiedAmount = amountInKobo / 100;

      // 4. Call the central processing function
      // NOTE: This assumes you added the userId to the Paystack metadata during the frontend call.
      await processVerifiedDeposit(userId, verifiedAmount, reference);

      // CRITICAL: Must return 200 OK to tell Paystack the event was handled.
      return successResponse(res, 200, "Webhook processed successfully.");
    } catch (error) {
      // Error processing transaction via webhook
      return errorResponse(res, 500, "Failed to process transaction.");
    }
  }

  // Acknowledge receipt of all other events (like 'transfer.success')
  return successResponse(res, 200, "Event received, no action taken.");
};
export const getBanks = async (req: Request, res: Response) => {
  try {
    const banks = await listBanks();
    return successResponse(res, 200, "Bank list fetched successfully.", banks);
  } catch (error) {
    // Error fetching banks
    return errorResponse(res, 500, "Unable to fetch bank list.");
  }
};

export const resolveAccountName = async (req: Request, res: Response) => {
  const { accountNumber, bankCode } = req.body as {
    accountNumber: string;
    bankCode: string;
  };

  if (!accountNumber || !bankCode) {
    return errorResponse(
      res,
      400,
      "Both accountNumber and bankCode are required."
    );
  }

  try {
    const resolution = await resolveAccountNameService(accountNumber, bankCode);

    return successResponse(res, 200, "Account resolved successfully.", {
      account_number: resolution.account_number,
      account_name: resolution.account_name,
      bank_id: resolution.bank_id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return errorResponse(res, 500, message);
  }
};
