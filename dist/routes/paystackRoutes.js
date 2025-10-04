"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paystackController_1 = require("../controllers/paystackController");
const router = (0, express_1.Router)();
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
router.get("/banks", paystackController_1.getBanks);
/**
 * @swagger
 * /api/paystack/webhook:
 *   post:
 *     summary: Handle Paystack webhook events
 *     tags: [Paystack]
 *     description: Receives and processes webhook events from Paystack payment gateway
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WebhookEvent'
 *     parameters:
 *       - in: header
 *         name: x-paystack-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Paystack webhook signature for verification
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid signature or malformed request
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
router.post("/webhook", paystackController_1.handleWebhook);
exports.default = router;
