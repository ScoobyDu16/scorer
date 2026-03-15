import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { getLeaderboard } from "./leaderboard.controller";

const router = Router();

router.get("/", authMiddleware, getLeaderboard);

export default router;
