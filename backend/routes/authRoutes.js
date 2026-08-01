import express from "express";
import { login, refreshSession, logout } from "../controllers/authController.js";
import {authorizeRoles, protect} from "../middleware/authMiddleware.js";
import { forgotPassword, verifyOtp, resetPassword } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/refresh", refreshSession);
router.post("/logout", logout);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;