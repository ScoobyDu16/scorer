import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { getDashboardStats, getDashboardTopPlayers } from "./dashboard.controller";

const router = Router();

router.get("/", authMiddleware, getDashboardStats);
router.get("/top-players", authMiddleware, getDashboardTopPlayers);

export default router;
