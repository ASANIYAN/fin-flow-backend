"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const loanRoutes_1 = __importDefault(require("./routes/loanRoutes"));
const swagger_1 = require("./config/swagger");
const paystackRoutes_1 = __importDefault(require("./routes/paystackRoutes"));
const walletRoutes_1 = __importDefault(require("./routes/walletRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// receive raw body for signature verification
app.use(express_1.default.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    },
}));
// Swagger Documentation Route
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.specs));
app.use("/api/auth", authRoutes_1.default);
app.use("/api/loans", loanRoutes_1.default);
app.use("/api/paystack", paystackRoutes_1.default);
app.use("/api/wallet", walletRoutes_1.default);
app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to Finflow API!" });
});
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
// Export the app for testing purposes
exports.default = app;
