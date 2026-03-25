import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { getLeaderboard } from "./leaderboard.controller";

const router = Router();

router.get("/", authenticateToken, getLeaderboard);

export default router;
