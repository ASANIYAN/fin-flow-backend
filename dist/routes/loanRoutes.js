"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loanController_1 = require("../controllers/loanController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
router.get("/dashboard", authMiddleware_1.authenticateToken, authMiddleware_1.requireEmailVerification, (0, authMiddleware_1.requireRole)(prisma_1.Role.BORROWER, prisma_1.Role.LENDER), loanController_1.getDashboardData);
// Only an authenticated, verified BORROWER can access this endpoint
router.post("/create-loan", authMiddleware_1.authenticateToken, authMiddleware_1.requireEmailVerification, (0, authMiddleware_1.requireRole)(prisma_1.Role.BORROWER), loanController_1.createLoan);
router.post("/:id/fund", // The loan ID is passed as a URL parameter
authMiddleware_1.authenticateToken, authMiddleware_1.requireEmailVerification, (0, authMiddleware_1.requireRole)(prisma_1.Role.LENDER), loanController_1.fundLoan);
router.get("/open", authMiddleware_1.authenticateToken, authMiddleware_1.requireEmailVerification, (0, authMiddleware_1.requireRole)(prisma_1.Role.LENDER), loanController_1.getOpenLoans);
exports.default = router;
