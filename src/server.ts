import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { specs } from "./config/swagger";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Swagger documentation setup
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "FinFlow API Documentation",
    swaggerOptions: {
      docExpansion: "list",
      filter: true,
      showRequestHeaders: true,
      supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
      tryItOutEnabled: true,
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to FinFlow API!",
    documentation: "/api-docs",
    version: "1.0.0",
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export the app for testing purposes
export default app;
