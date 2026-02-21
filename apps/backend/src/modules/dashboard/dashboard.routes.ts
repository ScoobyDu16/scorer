import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { getDashboardStats } from "./dashboard.controller";

const router = Router();

router.get("/", authMiddleware, getDashboardStats);

export default router;
