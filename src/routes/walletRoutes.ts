import { Router } from "express";
import { Role } from "../lib/prisma";
import { depositFunds, withdrawFunds } from "../controllers/walletController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/wallet/deposit:
 *   post:
 *     summary: Deposit funds into user wallet
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     description: Allows authenticated users to deposit funds into their wallet using payment reference
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepositRequest'
 *     responses:
 *       200:
 *         description: Funds deposited successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid amount, reference, or transaction already processed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/deposit",
  authenticateToken,
  requireRole(Role.BORROWER, Role.LENDER),
  depositFunds
);

/**
 * @swagger
 * /api/wallet/withdraw:
 *   post:
 *     summary: Withdraw funds from user wallet
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     description: Allows authenticated users to withdraw funds from their wallet to their bank account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WithdrawalRequest'
 *     responses:
 *       200:
 *         description: Withdrawal initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid amount, insufficient balance, or invalid bank details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/withdraw",
  authenticateToken,
  requireRole(Role.BORROWER, Role.LENDER),
  withdrawFunds
);

export default router;
