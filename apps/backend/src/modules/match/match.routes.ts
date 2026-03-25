import { Router } from "express";
import { AuthenticatedRequest, authenticateToken, requireScorer, requireTurfAdmin } from "../../middleware/auth";
import { requireScoringLock, requireNoScoringLock } from "../../middleware/scoring-lock.middleware";
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

// Apply authentication to all routes
router.use(authenticateToken);

// Get all matches for turf (TURF_ADMIN and SCORER)
router.get("/", requireTurfAdmin, getMatches);

// Get created matches for generate code page (TURF_ADMIN and SCORER)
router.get("/created", requireTurfAdmin, getCreatedMatches);

// Get single match details (All authenticated users)
router.get("/:matchId", getMatch);

// Delete match (TURF_ADMIN only) - requires no active scoring
router.delete("/:matchId", requireTurfAdmin, requireNoScoringLock, deleteMatch);

// Owner creates match (TURF_ADMIN and SCORER)
router.post("/", requireTurfAdmin, createMatch);

// Add players to match (TURF_ADMIN and SCORER)
router.post("/:matchId/players", requireTurfAdmin, addMatchPlayers);

// Get match players (All authenticated users)
router.get("/:matchId/players", getMatchPlayers);

// Start match (SCORER only) - requires scoring lock
router.post("/:matchId/start", requireScorer, requireScoringLock, startMatch);

// Start second innings (SCORER only) - requires scoring lock
router.post("/:matchId/start-second", requireScorer, requireScoringLock, startSecondInnings);

// Add ball (SCORER only) - requires scoring lock
router.post("/:matchId/balls", requireScorer, requireScoringLock, addBall);

// Undo last ball (SCORER only) - requires scoring lock
router.delete("/:matchId/balls/last", requireScorer, requireScoringLock, undoLastBall);

// End innings (SCORER only) - requires scoring lock
router.post("/:matchId/end-innings", requireScorer, requireScoringLock, endInnings);

// Get match score (All authenticated users)
router.get("/:matchId/score", getMatchScore);

// Get match scorecard (All authenticated users)
router.get("/:matchId/scorecard", getMatchScorecard);

export default router;
