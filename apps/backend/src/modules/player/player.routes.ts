import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { createPlayer, getPlayer, getPlayers, getPlayerStats, updatePlayer, deletePlayer } from "./player.controller";

const router = Router();

router.post("/", authMiddleware, createPlayer);
router.get("/", authMiddleware, getPlayers);
router.get("/:playerId", authMiddleware, getPlayer);
router.get("/:playerId/stats", authMiddleware, getPlayerStats);
router.put("/:playerId", authMiddleware, updatePlayer);
router.delete("/:playerId", authMiddleware, deletePlayer);

export default router;
