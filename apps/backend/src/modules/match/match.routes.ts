import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { addMatchPlayers, createMatch } from "./match.controller";

const router = Router();

// Owner creates match
router.post("/", authMiddleware, createMatch);

// Add players to match
router.post("/:matchId/players", authMiddleware, addMatchPlayers);

export default router;
