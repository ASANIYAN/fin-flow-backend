"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const walletController_1 = require("../controllers/walletController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Endpoint for lenders to deposit funds into their wallet.
// This is the endpoint that receives the webhook from the payment gateway.
router.post("/deposit", authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(prisma_1.Role.BORROWER, prisma_1.Role.LENDER), walletController_1.depositFunds);
router.post("/withdraw", authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(prisma_1.Role.BORROWER, prisma_1.Role.LENDER), walletController_1.withdrawFunds);
exports.default = router;
