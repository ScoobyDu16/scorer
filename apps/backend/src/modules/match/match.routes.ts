import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  addBall,
  addMatchPlayers,
  createMatch,
  endInnings,
  startMatch,
  undoLastBall,
} from "./match.controller";

const router = Router();

// Owner creates match
router.post("/", authMiddleware, createMatch);

// Add players to match
router.post("/:matchId/players", authMiddleware, addMatchPlayers);

router.post("/:matchId/start", authMiddleware, startMatch);

router.post("/:matchId/balls", authMiddleware, addBall);

router.delete("/:matchId/balls/last", authMiddleware, undoLastBall);

router.post("/:matchId/end-innings", authMiddleware, endInnings);

export default router;
