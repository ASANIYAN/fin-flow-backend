"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const walletController_1 = require("../controllers/walletController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
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
router.post("/deposit", authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(client_1.Role.BORROWER, client_1.Role.LENDER), walletController_1.depositFunds);
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
router.post("/withdraw", authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(client_1.Role.BORROWER, client_1.Role.LENDER), walletController_1.withdrawFunds);
exports.default = router;
