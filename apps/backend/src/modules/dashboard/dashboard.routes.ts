import { Router } from "express";
import { AuthenticatedRequest, authenticateToken, requireTurfAdmin, requireScorer, requirePlayer } from "../../middleware/auth";
import { getDashboardStats, getDashboardTopPlayers } from "./dashboard.controller";

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Dashboard stats (All authenticated users)
router.get("/", getDashboardStats);

// Top players (All authenticated users)
router.get("/top-players", getDashboardTopPlayers);

export default router;
