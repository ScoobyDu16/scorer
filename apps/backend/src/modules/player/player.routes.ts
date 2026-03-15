import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  createPlayer,
  getPlayer,
  getPlayers,
  getPlayerStats,
  getPlayerCareer,
  updatePlayer,
  deletePlayer,
  getPlayersYetToBat,
} from "./player.controller";

const router = Router();

router.post("/", authMiddleware, createPlayer);
router.get("/", authMiddleware, getPlayers);
router.get("/yet-to-bat", authMiddleware, getPlayersYetToBat);
router.get("/:playerId/career", authMiddleware, getPlayerCareer);
router.get("/:playerId/stats", authMiddleware, getPlayerStats);
router.get("/:playerId", authMiddleware, getPlayer);
router.put("/:playerId", authMiddleware, updatePlayer);
router.delete("/:playerId", authMiddleware, deletePlayer);

export default router;
