import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import express, { Request, Response } from "express";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use("/api/auth", authRoutes);

// Use Request and Response types
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Welcome to the Finflow API!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
