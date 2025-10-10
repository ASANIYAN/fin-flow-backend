import { Router } from "express";
import {
  authenticateToken,
  requireEmailVerification,
} from "../middleware/authMiddleware";
import {
  getDashboardData,
  createLoan,
  getMyLoans,
  fundLoan,
  getOpenLoans,
  repayLoan,
  getFundedLoans,
} from "../controllers/loanController";

const router = Router();

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
router.get(
  "/dashboard",
  authenticateToken,
  requireEmailVerification,
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
router.post(
  "/create-loan",
  authenticateToken,
  requireEmailVerification,
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
router.post(
  "/:id/fund", // The loan ID is passed as a URL parameter
  authenticateToken,
  requireEmailVerification,
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
router.get("/open", authenticateToken, requireEmailVerification, getOpenLoans);

/**
 * @swagger
 * /api/loans/{loanId}/repay:
 *   post:
 *     summary: Make a repayment towards a loan
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     description: |
 *       Allows the borrower to make repayments towards their active loans.
 *       Supports only full repayments. The borrower can only repay their own loans.
 *       Repayments are deducted from the borrower's available balance and distributed to lenders.
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the loan to repay
 *         example: "123e4567-e89b-12d3-a456-426614174001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0.01
 *                 description: The repayment amount (must be positive and not exceed outstanding balance)
 *                 example: 5000.00
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional description for the repayment transaction
 *                 example: "Monthly repayment installment #3"
 *           examples:
 *             partial_repayment:
 *               summary: Repayment
 *               value:
 *                 amount: 2500.00
 *                 description: "Repayment for June"
 *             full_repayment:
 *               summary: Full loan repayment
 *               value:
 *                 amount: 47500.00
 *                 description: "Full loan settlement"
 *     responses:
 *       200:
 *         description: Repayment processed successfully
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
 *                         transactionId:
 *                           type: string
 *                           format: uuid
 *                           description: ID of the repayment transaction
 *                         amountRepaid:
 *                           type: number
 *                           format: decimal
 *                           description: Amount successfully repaid
 *                         remainingBalance:
 *                           type: number
 *                           format: decimal
 *                           description: Remaining loan balance after repayment
 *                         loanStatus:
 *                           type: string
 *                           enum: [ACTIVE, REPAID]
 *                           description: Updated loan status after repayment
 *                         isFullyRepaid:
 *                           type: boolean
 *                           description: Whether the loan is now fully repaid
 *             examples:
 *               partial_repayment_success:
 *                 summary: Successful Repayment
 *                 value:
 *                   success: true
 *                   message: "Repayment processed successfully"
 *                   data:
 *                     transactionId: "456e7890-e12b-34d5-a678-426614174002"
 *                     amountRepaid: 2500.00
 *                     remainingBalance: 45000.00
 *                     loanStatus: "ACTIVE"
 *                     isFullyRepaid: false
 *               full_repayment_success:
 *                 summary: Successful full repayment
 *                 value:
 *                   success: true
 *                   message: "Loan fully repaid successfully"
 *                   data:
 *                     transactionId: "456e7890-e12b-34d5-a678-426614174003"
 *                     amountRepaid: 47500.00
 *                     remainingBalance: 0.00
 *                     loanStatus: "REPAID"
 *                     isFullyRepaid: true
 *       400:
 *         description: Invalid repayment request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_amount:
 *                 summary: Invalid repayment amount
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   error:
 *                     code: "VALIDATION_ERROR"
 *                     fields:
 *                       - field: "amount"
 *                         message: "Repayment amount must be positive and not exceed outstanding balance"
 *               insufficient_balance:
 *                 summary: Insufficient wallet balance
 *                 value:
 *                   success: false
 *                   message: "Insufficient available balance for repayment"
 *                   error:
 *                     code: "INSUFFICIENT_FUNDS"
 *               loan_not_active:
 *                 summary: Loan not in repayable state
 *                 value:
 *                   success: false
 *                   message: "Loan is not in ACTIVE status and cannot be repaid"
 *                   error:
 *                     code: "INVALID_LOAN_STATUS"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Access denied - not the loan borrower or email verification required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_borrower:
 *                 summary: Not the loan borrower
 *                 value:
 *                   success: false
 *                   message: "Access denied: You can only repay your own loans"
 *                   error:
 *                     code: "ACCESS_DENIED"
 *               email_not_verified:
 *                 summary: Email verification required
 *                 value:
 *                   success: false
 *                   message: "Email verification required to perform loan operations"
 *                   error:
 *                     code: "EMAIL_NOT_VERIFIED"
 *       404:
 *         description: Loan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               loan_not_found:
 *                 summary: Loan does not exist
 *                 value:
 *                   success: false
 *                   message: "Loan not found"
 *                   error:
 *                     code: "LOAN_NOT_FOUND"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Database or system error
 *                 value:
 *                   success: false
 *                   message: "An unexpected error occurred while processing repayment"
 *                   error:
 *                     code: "INTERNAL_ERROR"
 */
router.post("/:loanId/repay", authenticateToken, repayLoan);

/**
 * @swagger
 * /api/loans/funded:
 *   get:
 *     summary: Get loans funded by the authenticated user
 *     tags: [Loans]
 *     security:
 *       - BearerAuth: []
 *     description: |
 *       Returns a paginated list of loans that the authenticated user has funded.
 *       This endpoint allows lenders to view all their lending investments and track their returns.
 *       Includes loan details, funding amounts, repayment status, and earnings calculations.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, FUNDING, FULLY_FUNDED, ACTIVE, REPAID]
 *         description: Filter loans by their current status
 *         example: "ACTIVE"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt_asc, createdAt_desc, amountFunded_asc, amountFunded_desc, interestRate_asc, interestRate_desc]
 *           default: createdAt_desc
 *         description: |
 *           Sort field and order for the funded loans.
 *           Available options:
 *           - createdAt_asc/desc: Sort by loan creation date
 *           - amountFunded_asc/desc: Sort by funding amount
 *           - interestRate_asc/desc: Sort by loan interest rate
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to match loan title or borrower name
 *         example: "business expansion"
 *     responses:
 *       200:
 *         description: Funded loans retrieved successfully
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
 *                                 description: Unique loan identifier
 *                               title:
 *                                 type: string
 *                                 description: Loan title/purpose
 *                               description:
 *                                 type: string
 *                                 nullable: true
 *                                 description: Detailed loan description
 *                               amountRequested:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Total amount requested by borrower
 *                               amountFunded:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Total amount funded by all lenders
 *                               myFundingAmount:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Amount funded by the authenticated user
 *                               interestRate:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Annual interest rate percentage
 *                               duration:
 *                                 type: integer
 *                                 description: Loan duration
 *                               durationUnit:
 *                                 type: string
 *                                 enum: [DAYS, WEEKS, MONTHS, YEARS]
 *                                 description: Unit for loan duration
 *                               totalInterest:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Total interest amount for the loan
 *                               expectedEarnings:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Expected earnings from this funding
 *                               actualEarnings:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Actual earnings received so far
 *                               principalRepaid:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Principal amount repaid so far
 *                               status:
 *                                 type: string
 *                                 enum: [PENDING, FUNDING, FULLY_FUNDED, ACTIVE, REPAID]
 *                                 description: Current loan status
 *                               borrower:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                     format: uuid
 *                                   firstName:
 *                                     type: string
 *                                   lastName:
 *                                     type: string
 *                                   isEmailVerified:
 *                                     type: boolean
 *                                 description: Borrower information
 *                               fundingDate:
 *                                 type: string
 *                                 format: date-time
 *                                 description: Date when user funded this loan
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                                 description: Loan creation date
 *                               updatedAt:
 *                                 type: string
 *                                 format: date-time
 *                                 description: Last update date
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                               description: Current page number
 *                             pageSize:
 *                               type: integer
 *                               description: Items per page
 *                             totalCount:
 *                               type: integer
 *                               description: Total number of funded loans
 *                             totalPages:
 *                               type: integer
 *                               description: Total number of pages
 *                         summary:
 *                           type: object
 *                           properties:
 *                             totalFundedAmount:
 *                               type: number
 *                               format: decimal
 *                               description: Total amount funded across all loans
 *                             totalExpectedEarnings:
 *                               type: number
 *                               format: decimal
 *                               description: Total expected earnings from all funded loans
 *                             totalActualEarnings:
 *                               type: number
 *                               format: decimal
 *                               description: Total actual earnings received
 *                             activeLoansCount:
 *                               type: integer
 *                               description: Number of currently active funded loans
 *                             repaidLoansCount:
 *                               type: integer
 *                               description: Number of fully repaid funded loans
 *             examples:
 *               success:
 *                 summary: Sample funded loans response
 *                 value:
 *                   success: true
 *                   message: "Funded loans retrieved successfully"
 *                   data:
 *                     loans:
 *                       - id: "123e4567-e89b-12d3-a456-426614174001"
 *                         title: "Restaurant Equipment Purchase"
 *                         description: "Need funding to purchase new kitchen equipment"
 *                         amountRequested: 50000
 *                         amountFunded: 50000
 *                         myFundingAmount: 15000
 *                         interestRate: 12.5
 *                         duration: 24
 *                         durationUnit: "MONTHS"
 *                         totalInterest: 12500
 *                         expectedEarnings: 3750
 *                         actualEarnings: 1875
 *                         principalRepaid: 7500
 *                         status: "ACTIVE"
 *                         borrower:
 *                           id: "789e0123-e89b-12d3-a456-426614174000"
 *                           firstName: "Jane"
 *                           lastName: "Smith"
 *                           isEmailVerified: true
 *                         fundingDate: "2024-01-15T10:30:00.000Z"
 *                         createdAt: "2024-01-10T09:00:00.000Z"
 *                         updatedAt: "2024-02-01T14:22:00.000Z"
 *                       - id: "456e7890-e12b-34d5-a678-426614174002"
 *                         title: "Working Capital Loan"
 *                         description: "Short-term working capital for inventory"
 *                         amountRequested: 25000
 *                         amountFunded: 25000
 *                         myFundingAmount: 5000
 *                         interestRate: 15.0
 *                         duration: 12
 *                         durationUnit: "MONTHS"
 *                         totalInterest: 3750
 *                         expectedEarnings: 750
 *                         actualEarnings: 750
 *                         principalRepaid: 5000
 *                         status: "REPAID"
 *                         borrower:
 *                           id: "abc1234-e89b-12d3-a456-426614174003"
 *                           firstName: "Robert"
 *                           lastName: "Johnson"
 *                           isEmailVerified: true
 *                         fundingDate: "2023-12-01T08:15:00.000Z"
 *                         createdAt: "2023-11-28T16:45:00.000Z"
 *                         updatedAt: "2024-01-05T11:30:00.000Z"
 *                     pagination:
 *                       page: 1
 *                       pageSize: 10
 *                       totalCount: 2
 *                       totalPages: 1
 *                     summary:
 *                       totalFundedAmount: 20000
 *                       totalExpectedEarnings: 4500
 *                       totalActualEarnings: 2625
 *                       activeLoansCount: 1
 *                       repaidLoansCount: 1
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_pagination:
 *                 summary: Invalid pagination parameters
 *                 value:
 *                   success: false
 *                   message: "Validation failed for query parameters"
 *                   error:
 *                     code: "VALIDATION_ERROR"
 *                     fields:
 *                       - field: "page"
 *                         message: "Page must be a positive integer"
 *               invalid_sort:
 *                 summary: Invalid sort parameter
 *                 value:
 *                   success: false
 *                   message: "Invalid sort parameter"
 *                   error:
 *                     code: "VALIDATION_ERROR"
 *                     fields:
 *                       - field: "sortBy"
 *                         message: "Sort field must be one of the allowed values"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_authenticated:
 *                 summary: Missing or invalid authentication token
 *                 value:
 *                   success: false
 *                   message: "Authentication required"
 *                   error:
 *                     code: "AUTHENTICATION_REQUIRED"
 *       403:
 *         description: Access denied - email verification required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               email_not_verified:
 *                 summary: Email verification required
 *                 value:
 *                   success: false
 *                   message: "Email verification required to access funded loans"
 *                   error:
 *                     code: "EMAIL_NOT_VERIFIED"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Database or system error
 *                 value:
 *                   success: false
 *                   message: "An unexpected error occurred while retrieving funded loans"
 *                   error:
 *                     code: "INTERNAL_ERROR"
 */
router.get("/funded", authenticateToken, getFundedLoans);

export default router;
