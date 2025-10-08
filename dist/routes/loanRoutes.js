"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const loanController_1 = require("../controllers/loanController");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/loans/dashboard:
 *   get:
 *     summary: Get unified dashboard data for P2P lending
 *     description: Returns comprehensive dashboard showing both borrower and lender activities for the authenticated user
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Unified dashboard data retrieved successfully
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
 *                   example: "Dashboard data fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/UnifiedDashboard'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Email verification required
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
router.get("/dashboard", authMiddleware_1.authenticateToken, authMiddleware_1.requireEmailVerification, loanController_1.getDashboardData);
/**
 * @swagger
 * /api/loans/create-loan:
 *   post:
 *     summary: Create a new loan application
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     description: Any authenticated and verified user can create loan applications
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
router.post("/create-loan", authMiddleware_1.authenticateToken, authMiddleware_1.requireEmailVerification, loanController_1.createLoan);
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
router.get("/my-loans", authMiddleware_1.authenticateToken, authMiddleware_1.requireEmailVerification, loanController_1.getMyLoans);
/**
 * @swagger
 * /api/loans/{id}/fund:
 *   post:
 *     summary: Fund a loan
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     description: Any authenticated and verified user can fund loans (except their own)
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
router.post("/:id/fund", // The loan ID is passed as a URL parameter
authMiddleware_1.authenticateToken, authMiddleware_1.requireEmailVerification, loanController_1.fundLoan);
/**
 * @swagger
 * /api/loans/open:
 *   get:
 *     summary: Get open loans available for funding
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     description: Returns a paginated list of open loans available for funding (excludes user's own loans)
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
router.get("/open", authMiddleware_1.authenticateToken, authMiddleware_1.requireEmailVerification, loanController_1.getOpenLoans);
exports.default = router;
