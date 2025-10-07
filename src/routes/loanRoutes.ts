import { Router } from "express";
import {
  authenticateToken,
  requireEmailVerification,
  requireRole,
} from "../middleware/authMiddleware";
import {
  getDashboardData,
  createLoan,
  getMyLoans,
  fundLoan,
  getOpenLoans,
} from "../controllers/loanController";
import { Role } from "../lib/prisma";

const router = Router();

/**
 * @swagger
 * /api/loans/dashboard:
 *   get:
 *     summary: Get dashboard data for borrower or lender
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/BorrowerDashboard'
 *                 - $ref: '#/components/schemas/LenderDashboard'
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
 *                                 enum: [PENDING, FUNDING, FULLY_FUNDED, ACTIVE, REPAID]
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
 *                                 enum: [PENDING, FUNDING, FULLY_FUNDED, ACTIVE, REPAID]
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
 *             examples:
 *               borrower:
 *                 summary: Borrower Dashboard Response
 *                 description: Response when user has BORROWER role
 *                 value:
 *                   success: true
 *                   message: "Borrower dashboard data fetched successfully"
 *                   data:
 *                     totalApplications: 5
 *                     pendingApplications: 2
 *                     activeLoans:
 *                       - id: "123e4567-e89b-12d3-a456-426614174001"
 *                         title: "Business Expansion Loan"
 *                         description: "Loan for expanding my restaurant business"
 *                         amountRequested: 50000
 *                         amountFunded: 35000
 *                         interestRate: 12.5
 *                         duration: 24
 *                         durationUnit: "MONTHS"
 *                         totalInterest: 12500.0
 *                         status: "FUNDING"
 *                         createdAt: "2024-09-15T10:30:00.000Z"
 *                         updatedAt: "2024-09-20T14:15:00.000Z"
 *                       - id: "987f6543-e21d-34c5-b678-123456789012"
 *                         title: "Equipment Purchase"
 *                         description: "New machinery for production line"
 *                         amountRequested: 75000
 *                         amountFunded: 75000
 *                         interestRate: 10.0
 *                         duration: 36
 *                         durationUnit: "MONTHS"
 *                         totalInterest: 22500.0
 *                         status: "FULLY_FUNDED"
 *                         createdAt: "2024-08-20T09:15:00.000Z"
 *                         updatedAt: "2024-09-10T16:45:00.000Z"
 *               lender:
 *                 summary: Lender Dashboard Response
 *                 description: Response when user has LENDER role
 *                 value:
 *                   success: true
 *                   message: "Lender dashboard data fetched successfully"
 *                   data:
 *                     investmentSummary:
 *                       totalInvested: 150000
 *                       totalEarnings: 7500
 *                       activeInvestments: 8
 *                     newListings:
 *                       - id: "456f7890-e12c-34d5-b678-901234567890"
 *                         title: "Agricultural Equipment Purchase"
 *                         description: "Need funds to purchase farming equipment"
 *                         amountRequested: 75000
 *                         amountFunded: 0
 *                         interestRate: 15.0
 *                         duration: 18
 *                         durationUnit: "MONTHS"
 *                         totalInterest: 16875.0
 *                         status: "PENDING"
 *                         borrower: "John Smith"
 *                         progress: 0
 *                         createdAt: "2024-09-22T08:45:00.000Z"
 *                       - id: "789a1234-f56g-78h9-i012-345678901234"
 *                         title: "Small Business Startup"
 *                         description: "Launch a local bakery business"
 *                         amountRequested: 25000
 *                         amountFunded: 15000
 *                         interestRate: 18.5
 *                         duration: 12
 *                         durationUnit: "WEEKS"
 *                         totalInterest: 1067.31
 *                         status: "FUNDING"
 *                         borrower: "Maria Garcia"
 *                         progress: 60
 *                         createdAt: "2024-09-20T14:30:00.000Z"
 *                       - id: "234b5678-c90d-12e3-f456-789012345678"
 *                         title: "Medical Equipment Upgrade"
 *                         description: "Upgrade clinic diagnostic equipment"
 *                         amountRequested: 120000
 *                         amountFunded: 0
 *                         interestRate: 12.0
 *                         duration: 48
 *                         durationUnit: "MONTHS"
 *                         totalInterest: 57600.0
 *                         status: "PENDING"
 *                         borrower: "Dr. James Wilson"
 *                         progress: 0
 *                         createdAt: "2024-09-21T11:15:00.000Z"
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
 * /api/loans/my-loans:
 *   get:
 *     summary: Get all loans created by the authenticated borrower
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     description: Returns paginated list of loans created by the authenticated borrower. Supports search, amount filtering and status filtering.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination (default 1)
 *         example: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of items per page (default 10)
 *         example: 10
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term to match loan title or description
 *         example: "business"
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum requested amount to filter
 *         example: 1000
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum requested amount to filter
 *         example: 50000
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, FUNDING, FULLY_FUNDED, ACTIVE, REPAID]
 *         description: Filter loans by status
 *         example: "PENDING"
 *     responses:
 *       200:
 *         description: Borrower's loans fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User loans fetched successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     loans:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Loan'
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     totalCount:
 *                       type: integer
 *                       example: 2
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *             examples:
 *               success:
 *                 summary: Sample response
 *                 value:
 *                   success: true
 *                   message: "User loans fetched successfully."
 *                   data:
 *                     loans:
 *                       - id: "123e4567-e89b-12d3-a456-426614174001"
 *                         title: "Business Expansion Loan"
 *                         description: "Loan for expanding my restaurant business"
 *                         amountRequested: 50000
 *                         amountFunded: 35000
 *                         interestRate: 12.5
 *                         duration: 24
 *                         durationUnit: "MONTHS"
 *                         totalInterest: 12500.0
 *                         status: "FUNDING"
 *                         createdAt: "2024-09-15T10:30:00.000Z"
 *                         updatedAt: "2024-09-20T14:15:00.000Z"
 *                     page: 1
 *                     pageSize: 10
 *                     totalCount: 1
 *                     totalPages: 1
 *       400:
 *         description: Validation error for query parameters
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
 *         description: Access denied or email verification required
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
  "/my-loans",
  authenticateToken,
  requireEmailVerification,
  requireRole(Role.BORROWER),
  getMyLoans
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
 *           enum: [createdAt_asc, createdAt_desc, amountRequested_asc, amountRequested_desc, interestRate_asc, interestRate_desc]
 *           default: createdAt_desc
 *         description: |
 *           Sort field and order. Accepts either a full value with direction
 *           (e.g. `createdAt_desc`, `amountRequested_asc`) or a plain field name
 *           (e.g. `createdAt`). When a plain field name is provided the default
 *           ordering is descending (equivalent to `<field>_desc`).
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
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               title:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                                 nullable: true
 *                               amountRequested:
 *                                 type: number
 *                                 format: decimal
 *                               amountFunded:
 *                                 type: number
 *                                 format: decimal
 *                               interestRate:
 *                                 type: number
 *                                 format: decimal
 *                               duration:
 *                                 type: integer
 *                               durationUnit:
 *                                 type: string
 *                                 example: "MONTHS"
 *                               totalInterest:
 *                                 type: number
 *                                 format: decimal
 *                               principalRepaid:
 *                                 type: number
 *                                 format: decimal
 *                               status:
 *                                 type: string
 *                                 enum: [PENDING, FUNDING, FULLY_FUNDED, ACTIVE, REPAID]
 *                               borrowerId:
 *                                 type: string
 *                                 format: uuid
 *                               borrower:
 *                                 type: object
 *                                 properties:
 *                                   firstName:
 *                                     type: string
 *                                   lastName:
 *                                     type: string
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                               updatedAt:
 *                                 type: string
 *                                 format: date-time
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             pageSize:
 *                               type: integer
 *                             totalCount:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *             examples:
 *               success:
 *                 summary: Sample open loans response
 *                 value:
 *                   success: true
 *                   message: "Open loans fetched successfully."
 *                   data:
 *                     loans:
 *                       - id: "123e4567-e89b-12d3-a456-426614174001"
 *                         title: "Small Business Expansion"
 *                         description: "Funding needed to expand our retail operations"
 *                         amountRequested: 50000
 *                         amountFunded: 25000
 *                         interestRate: 12.5
 *                         duration: 24
 *                         durationUnit: "MONTHS"
 *                         totalInterest: 12500
 *                         principalRepaid: 0
 *                         status: "PENDING"
 *                         borrowerId: "123e4567-e89b-12d3-a456-426614174000"
 *                         borrower:
 *                           firstName: "John"
 *                           lastName: "Doe"
 *                         createdAt: "2024-01-01T00:00:00.000Z"
 *                         updatedAt: "2024-01-01T00:00:00.000Z"
 *                   pagination:
 *                     page: 1
 *                     pageSize: 10
 *                     totalCount: 1
 *                     totalPages: 1
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
