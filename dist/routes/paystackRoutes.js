"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paystackController_1 = require("../controllers/paystackController");
const router = (0, express_1.Router)();
// Endpoint for frontend to get list of all Nigerian banks
router.get("/banks", paystackController_1.getBanks);
// This is the public endpoint that will receive webhooks from Paystack.
router.post("/webhook", paystackController_1.handleWebhook);
exports.default = router;
