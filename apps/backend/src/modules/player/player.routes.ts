import { Router } from "express";
import { AuthenticatedRequest, authenticateToken, requirePlayer, requireTurfAdmin, requireScorer } from "../../middleware/auth";
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

// Apply authentication to all routes
router.use(authenticateToken);

// Create player (TURF_ADMIN and SCORER)
router.post("/", requireTurfAdmin, createPlayer);

// Get all players (All authenticated users)
router.get("/", getPlayers);

// Get players yet to bat (All authenticated users)
router.get("/yet-to-bat", getPlayersYetToBat);

// Get player career stats (All authenticated users)
router.get("/:playerId/career", getPlayerCareer);

// Get player stats (All authenticated users)
router.get("/:playerId/stats", getPlayerStats);

// Get player details (All authenticated users)
router.get("/:playerId", getPlayer);

// Update player (TURF_ADMIN and SCORER)
router.put("/:playerId", requireTurfAdmin, updatePlayer);

// Delete player (TURF_ADMIN only)
router.delete("/:playerId", requireTurfAdmin, deletePlayer);

export default router;
