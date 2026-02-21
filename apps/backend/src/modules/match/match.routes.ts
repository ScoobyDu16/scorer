import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  addBall,
  addMatchPlayers,
  createMatch,
  endInnings,
  getMatchDetails,
  getMatchScore,
  getMatchPlayers,
  setOpeningPlayers,
  startInningsWithPlayers,
  startMatch,
  undoLastBall,
} from "./match.controller";

const router = Router();

// Get match details
router.get("/:matchId", authMiddleware, getMatchDetails);

// Owner creates match
router.post("/", authMiddleware, createMatch);

// Add players to match
router.post("/:matchId/players", authMiddleware, addMatchPlayers);

// Get players for match
router.get("/:matchId/players", authMiddleware, getMatchPlayers);

router.post("/:matchId/start", authMiddleware, startMatch);

router.post("/:matchId/start-with-players", authMiddleware, startInningsWithPlayers);

router.post("/:matchId/opening-players", authMiddleware, setOpeningPlayers);

router.post("/:matchId/balls", authMiddleware, addBall);

router.delete("/:matchId/balls/last", authMiddleware, undoLastBall);

router.post("/:matchId/end-innings", authMiddleware, endInnings);

router.get("/:matchId/score", getMatchScore);

export default router;
