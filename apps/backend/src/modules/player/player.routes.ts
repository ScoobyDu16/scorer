import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { createPlayer, getPlayers, getPlayerStats } from "./player.controller";

const router = Router();

router.post("/", authMiddleware, createPlayer);
router.get("/", authMiddleware, getPlayers);
router.get("/:playerId/stats", authMiddleware, getPlayerStats);

export default router;
