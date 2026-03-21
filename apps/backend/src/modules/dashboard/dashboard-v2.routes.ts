import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { getDashboard } from "./dashboard-v2.controller";

const router = Router();

// Get role-based dashboard
router.get("/", authMiddleware, getDashboard);

export default router;
