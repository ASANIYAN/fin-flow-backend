import { Router, Request, Response } from "express";
import {
  getUserProfile,
  updateUserProfile,
  getUserTransactions,
} from "../controllers/userController";
import {
  authenticateToken,
  requireEmailVerification,
} from "../middleware/authMiddleware";
import { AuthenticatedRequest } from "../types/auth";

const router = Router();

// Wrapper functions to handle type casting for Express routes
const getUserProfileHandler = (req: Request, res: Response) => {
  return getUserProfile(req as AuthenticatedRequest, res);
};

const updateUserProfileHandler = (req: Request, res: Response) => {
  return updateUserProfile(req as AuthenticatedRequest, res);
};

const getUserTransactionsHandler = (req: Request, res: Response) => {
  return getUserTransactions(req as AuthenticatedRequest, res);
};

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User profile and transaction management
 */

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                   example: "User profile fetched successfully."
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "User not found."
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/profile",
  authenticateToken,
  requireEmailVerification,
  getUserProfileHandler
);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information (firstName and lastName only)
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Doe"
 *             required:
 *               - firstName
 *               - lastName
 *     responses:
 *       200:
 *         description: User profile updated successfully
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
 *                   example: "User profile updated successfully."
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No valid fields provided for update."
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  "/profile",
  authenticateToken,
  requireEmailVerification,
  updateUserProfileHandler
);

/**
 * @swagger
 * /api/user/transactions:
 *   get:
 *     summary: Get user transactions
 *     description: Retrieve paginated transaction history for the authenticated user
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
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
 *         description: Number of transactions per page
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query to filter transactions by type, status, or loan title
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
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
 *                   example: "Transactions fetched successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     totalCount:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/transactions",
  authenticateToken,
  requireEmailVerification,
  getUserTransactionsHandler
);

export default router;
