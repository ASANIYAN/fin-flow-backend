import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

// Use Request and Response types
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Welcome to Finflow API!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
