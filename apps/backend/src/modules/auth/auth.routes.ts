import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { loginUser, registerUser, sendOTP, sendRegistrationOTPController, getProfile } from "./auth.controller";

const router = Router();

// Public routes
router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/send-otp", sendOTP);
router.post("/send-registration-otp", sendRegistrationOTPController);

// Protected routes
router.get("/profile", authMiddleware, getProfile);

export default router;
