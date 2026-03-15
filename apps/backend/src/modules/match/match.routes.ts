import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  addBall,
  addMatchPlayers,
  createMatch,
  deleteMatch,
  endInnings,
  getCreatedMatches,
  getMatch,
  getMatchPlayers,
  getMatchScore,
  getMatchScorecard,
  getMatches,
  startMatch,
  startSecondInnings,
  undoLastBall,
} from "./match.controller";

const router = Router();

// Get all matches for turf
router.get("/", authMiddleware, getMatches);

// Get created matches for generate code page
router.get("/created", authMiddleware, getCreatedMatches);

// Get single match details
router.get("/:matchId", authMiddleware, getMatch);

// Delete match
router.delete("/:matchId", authMiddleware, deleteMatch);

// Owner creates match
router.post("/", authMiddleware, createMatch);

// Add players to match
router.post("/:matchId/players", authMiddleware, addMatchPlayers);

// Get match players
router.get("/:matchId/players", authMiddleware, getMatchPlayers);

router.post("/:matchId/start", authMiddleware, startMatch);

router.post("/:matchId/start-second", authMiddleware, startSecondInnings);

router.post("/:matchId/balls", authMiddleware, addBall);

router.delete("/:matchId/balls/last", authMiddleware, undoLastBall);

router.post("/:matchId/end-innings", authMiddleware, endInnings);

router.get("/:matchId/score", getMatchScore);

router.get("/:matchId/scorecard", getMatchScorecard);

export default router;
