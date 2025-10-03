import axios from "axios";
import { PrismaClient, TransactionType } from "../lib/prisma";
import { findUserById } from "./userService";

const prisma = new PrismaClient();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY as string;

export const depositFundsService = async (
  userId: string,
  amount: number,
  reference: string
) => {
  return prisma.$transaction(async (prisma: any) => {
    // 1. Verify the transaction with Paystack (critical step)
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = response.data.data;

    if (data.status !== "success" || data.amount / 100 !== amount) {
      throw new Error("Transaction verification failed or amount mismatch.");
    }

    // 2. Check if the deposit has already been processed to prevent double-spending
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        description: `Deposit via Paystack, Ref: ${reference}`,
        userId: userId,
      },
    });

    if (existingTransaction) {
      throw new Error("This transaction has already been processed.");
    }

    // 3. Update the user's wallet balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { availableBalance: true, escrowBalance: true },
    });
    const newBalance = (user?.availableBalance.toNumber() || 0) + amount;
    await prisma.user.update({
      where: { id: userId },
      data: { availableBalance: newBalance },
    });

    // 4. Create a transaction record
    await prisma.transaction.create({
      data: {
        userId: userId,
        amount: amount,
        type: "DEPOSIT",
        description: `Deposit via Paystack, Ref: ${reference}`,
      },
    });
  });
};

const createTransferRecipient = async (
  name: string,
  accountNumber: string,
  bankCode: string
) => {
  const response = await axios.post(
    `https://api.paystack.co/transferrecipient`,
    {
      type: "nuban",
      name: name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );
  return response.data.data.recipient_code;
};

// New function to initiate a transfer with Paystack
const initiateTransfer = async (amount: number, recipientCode: string) => {
  const response = await axios.post(
    `https://api.paystack.co/transfer`,
    {
      source: "balance",
      amount: amount * 100, // Paystack uses kobo
      recipient: recipientCode,
      reason: "Withdrawal from P2P lending platform",
    },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );
  return response.data.data.reference;
};

export const withdrawFundsService = async (
  userId: string,
  amount: number,
  accountNumber: string,
  bankCode: string
) => {
  return prisma.$transaction(async (prisma: any) => {
    const user = await findUserById(userId);
    if (!user || user.availableBalance.toNumber() < amount) {
      throw new Error("Insufficient funds in wallet.");
    }

    // 1. Create a transfer recipient with Paystack
    const recipientCode = await createTransferRecipient(
      `${user.firstName} ${user.lastName}`,
      accountNumber,
      bankCode
    );

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
        type: TransactionType.WITHDRAWAL,
        description: `Withdrawal, Ref: ${transferReference}`,
      },
    });

    return { message: "Withdrawal initiated successfully." };
  });
};
