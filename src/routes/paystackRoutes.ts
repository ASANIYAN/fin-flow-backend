import { Router } from "express";
import {
  getBanks,
  handleWebhook,
  resolveAccountName,
} from "../controllers/paystackController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/paystack/banks:
 *   get:
 *     summary: Get list of Nigerian banks
 *     tags: [Paystack]
 *     description: Returns a list of all supported Nigerian banks for payments
 *     responses:
 *       200:
 *         description: Banks list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Bank'
 *             examples:
 *               success:
 *                 summary: Sample banks list
 *                 value:
 *                   success: true
 *                   message: "Bank list fetched successfully."
 *                   data:
 *                     - name: "9mobile 9Payment Service Bank"
 *                       code: "120001"
 *                     - name: "Abbey Mortgage Bank"
 *                       code: "404"
 *                     - name: "Above Only MFB"
 *                       code: "51204"
 *                     - name: "Abulesoro MFB"
 *                       code: "51312"
 *                     - name: "Access Bank"
 *                       code: "044"
 *                     - name: "Access Bank (Diamond)"
 *                       code: "063"
 *                     - name: "Accion Microfinance Bank"
 *                       code: "602"
 *                     - name: "Aella MFB"
 *                       code: "50315"
 *                     - name: "AG Mortgage Bank"
 *                       code: "90077"
 *                     - name: "Ahmadu Bello University Microfinance Bank"
 *                       code: "50036"
 *                     - name: "Airtel Smartcash PSB"
 *                       code: "120004"
 *                     - name: "AKU Microfinance Bank"
 *                       code: "51336"
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/banks", getBanks);

router.post("/webhook", handleWebhook);

/**
 * @swagger
 * /api/paystack/resolve-account:
 *   post:
 *     summary: Resolve bank account name
 *     tags: [Paystack]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - bankCode
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: "0123456789"
 *               bankCode:
 *                 type: string
 *                 example: "044"
 *     responses:
 *       200:
 *         description: Account resolved successfully
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
 *                         account_number:
 *                           type: string
 *                         account_name:
 *                           type: string
 *                         bank_id:
 *                           type: number
 *             examples:
 *               success:
 *                 summary: Sample resolution
 *                 value:
 *                   success: true
 *                   message: "Account resolved successfully."
 *                   data:
 *                     account_number: "0123456789"
 *                     account_name: "John Doe"
 *                     bank_id: 44
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/resolve-account", authenticateToken, resolveAccountName);

export default router;
