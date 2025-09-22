import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/authRoutes";
import loanRoutes from "./routes/loanRoutes";
import { specs } from "./config/swagger";
import paystackRoutes from "./routes/paystackRoutes";
import walletRoutes from "./routes/walletRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
// receive raw body for signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);

// Swagger Documentation Route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use("/api/auth", authRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/paystack", paystackRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/user", userRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to Finflow API!" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export the app for testing purposes
export default app;
