import { Router } from "express";
import {
  forgotPassword,
  login,
  resetPassword,
  signup,
} from "../controllers/authController";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
