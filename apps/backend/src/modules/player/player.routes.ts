import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { createPlayer, getPlayers, getPlayerStats, getAllPlayers } from "./player.controller";

const router = Router();

router.post("/", authMiddleware, createPlayer);
router.get("/", authMiddleware, getAllPlayers);
router.get("/:playerId/stats", authMiddleware, getPlayerStats);

export default router;
