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
 *     description: Returns dashboard data based on user role. Borrowers receive loan application statistics and active loans, while lenders receive investment summaries and new loan listings.
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   title: Borrower Dashboard Response
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Borrower dashboard data fetched successfully"
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalApplications:
 *                           type: integer
 *                           description: Total number of loan applications submitted by borrower
 *                           example: 5
 *                         pendingApplications:
 *                           type: integer
 *                           description: Number of loan applications awaiting approval or funding
 *                           example: 2
 *                         activeLoans:
 *                           type: array
 *                           description: List of currently active loans (funded or being funded)
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "123e4567-e89b-12d3-a456-426614174001"
 *                               title:
 *                                 type: string
 *                                 example: "Business Expansion Loan"
 *                               description:
 *                                 type: string
 *                                 nullable: true
 *                                 example: "Loan for expanding my restaurant business"
 *                               amountRequested:
 *                                 type: number
 *                                 format: decimal
 *                                 example: 50000
 *                               amountFunded:
 *                                 type: number
 *                                 format: decimal
 *                                 example: 35000
 *                               interestRate:
 *                                 type: number
 *                                 format: decimal
 *                                 example: 12.5
 *                               duration:
 *                                 type: integer
 *                                 description: Loan duration in months
 *                                 example: 24
 *                               status:
 *                                 type: string
 *                                 enum: [PENDING, FUNDING, FUNDED, COMPLETED, CANCELLED]
 *                                 example: "FUNDING"
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2024-09-15T10:30:00.000Z"
 *                               updatedAt:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2024-09-20T14:15:00.000Z"
 *                 - type: object
 *                   title: Lender Dashboard Response
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Lender dashboard data fetched successfully"
 *                     data:
 *                       type: object
 *                       properties:
 *                         investmentSummary:
 *                           type: object
 *                           description: Summary of lender's investment portfolio
 *                           properties:
 *                             totalInvested:
 *                               type: number
 *                               format: decimal
 *                               description: Total amount invested across all loans
 *                               example: 150000
 *                             totalEarnings:
 *                               type: number
 *                               format: decimal
 *                               description: Total estimated earnings from investments
 *                               example: 7500
 *                             activeInvestments:
 *                               type: integer
 *                               description: Number of active loan investments
 *                               example: 8
 *                         newListings:
 *                           type: array
 *                           description: Recent loan listings available for funding
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "456f7890-e12c-34d5-b678-901234567890"
 *                               title:
 *                                 type: string
 *                                 example: "Agricultural Equipment Purchase"
 *                               description:
 *                                 type: string
 *                                 nullable: true
 *                                 example: "Need funds to purchase farming equipment"
 *                               amountRequested:
 *                                 type: number
 *                                 format: decimal
 *                                 example: 75000
 *                               amountFunded:
 *                                 type: number
 *                                 format: decimal
 *                                 example: 0
 *                               interestRate:
 *                                 type: number
 *                                 format: decimal
 *                                 example: 15.0
 *                               duration:
 *                                 type: integer
 *                                 description: Loan duration in months
 *                                 example: 18
 *                               status:
 *                                 type: string
 *                                 enum: [PENDING, FUNDING, FUNDED, COMPLETED, CANCELLED]
 *                                 example: "PENDING"
 *                               borrower:
 *                                 type: string
 *                                 description: Borrower's full name
 *                                 example: "John Smith"
 *                               progress:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Funding progress percentage (0-100)
 *                                 example: 0
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2024-09-22T08:45:00.000Z"
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
