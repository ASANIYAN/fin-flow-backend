import { Router } from "express";
import {
  createLoan,
  fundLoan,
  getDashboardData,
  getOpenLoans,
} from "../controllers/loanController";
import {
  authenticateToken,
  requireEmailVerification,
  requireRole,
} from "../middleware/authMiddleware";
import { Role } from "../lib/prisma";

const router = Router();

/**
 * @swagger
 * /api/loans/dashboard:
 *   get:
 *     summary: Get role-specific dashboard data
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     description: Returns dashboard data based on user role (BORROWER or LENDER)
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/BorrowerDashboard'
 *                         - $ref: '#/components/schemas/LenderDashboard'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Email verification required or invalid role
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
router.get(
  "/dashboard",
  authenticateToken,
  requireEmailVerification,
  requireRole(Role.BORROWER, Role.LENDER),
  getDashboardData
);

/**
 * @swagger
 * /api/loans/create-loan:
 *   post:
 *     summary: Create a new loan application
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     description: Only authenticated and verified borrowers can create loan applications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLoanRequest'
 *     responses:
 *       201:
 *         description: Loan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Loan'
 *       400:
 *         description: Invalid input data
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
 *       403:
 *         description: Access denied - BORROWER role or email verification required
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
  "/create-loan",
  authenticateToken,
  requireEmailVerification,
  requireRole(Role.BORROWER),
  createLoan
);

/**
 * @swagger
 * /api/loans/{id}/fund:
 *   post:
 *     summary: Fund a loan
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     description: Only authenticated and verified lenders can fund loans
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Loan ID to fund
 *         example: "123e4567-e89b-12d3-a456-426614174001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FundLoanRequest'
 *     responses:
 *       200:
 *         description: Loan funded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid input data or insufficient funds
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
 *       403:
 *         description: Access denied - LENDER role or email verification required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Loan not found
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
  "/:id/fund", // The loan ID is passed as a URL parameter
  authenticateToken,
  requireEmailVerification,
  requireRole(Role.LENDER),
  fundLoan
);

/**
 * @swagger
 * /api/loans/open:
 *   get:
 *     summary: Get open loans available for funding
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     description: Returns a paginated list of open loans that lenders can fund
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for loan title or description
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *           format: decimal
 *         description: Minimum loan amount filter
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *           format: decimal
 *         description: Maximum loan amount filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, amountRequested, interestRate]
 *           default: createdAt
 *         description: Sort field
 *     responses:
 *       200:
 *         description: Open loans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         loans:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Loan'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             pageSize:
 *                               type: integer
 *                             totalItems:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Access denied - LENDER role or email verification required
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
router.get(
  "/open",
  authenticateToken,
  requireEmailVerification,
  requireRole(Role.LENDER),
  getOpenLoans
);

export default router;
