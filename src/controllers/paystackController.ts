import { Request, Response } from "express";
import crypto from "crypto";
import { listBanks, verifyTransaction } from "../services/paystackService";
import { errorResponse, successResponse } from "../utils/message";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY as string;

// Ensure the secret key is available at startup
if (!PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY environment variable is not set.");
}

export const handleWebhook = async (req: Request, res: Response) => {
  const hash = req.headers["x-paystack-signature"] as string;

  // 1. Check for the signature header
  if (!hash) {
    return errorResponse(res, 400, "Missing webhook signature.");
  }

  // 2. Compute the hash from the request body and secret key
  const expectedHash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  // 3. Compare the computed hash with the signature from the header
  if (expectedHash !== hash) {
    // Log the error for monitoring but don't expose sensitive info
    console.warn("Paystack webhook signature mismatch detected.");
    return errorResponse(res, 403, "Invalid signature.");
  }

  // Signature is valid, so now we can trust the event
  const event = req.body;

  if (event.event === "charge.success") {
    try {
      const reference = event.data?.reference;
      if (!reference) {
        // Malformed data - acknowledge but don't process
        return successResponse(
          res,
          200,
          "Webhook received but no reference found."
        );
      }

      await verifyTransaction(reference);
      // It's important to return a 200 OK to acknowledge receipt of the event
      return successResponse(res, 200, "Webhook processed successfully.");
    } catch (error) {
      console.error("Error verifying transaction:", error);
      // Return a non-success code to signal an issue to Paystack for retries
      return errorResponse(res, 500, "Failed to process transaction.");
    }
  }

  // Handle other webhook events if necessary
  // Acknowledge receipt of the event even if it's not a 'charge.success'
  return successResponse(res, 200, "Event received, no action taken.");
};

export const getBanks = async (req: Request, res: Response) => {
  try {
    const banks = await listBanks();
    return successResponse(res, 200, "Bank list fetched successfully.", banks);
  } catch (error) {
    console.error("Error fetching banks:", error);
    return errorResponse(res, 500, "Unable to fetch bank list.");
  }
};
