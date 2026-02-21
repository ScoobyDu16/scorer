import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  generateAccessCode,
  getAccessCodeByMatchId,
  validateAccessCode,
} from "./access-code.controller";

const router = Router();

// Get access code for a match (protected)
router.get("/:matchId", authMiddleware, getAccessCodeByMatchId);

// Owner generates code (protected)
router.post("/generate", authMiddleware, generateAccessCode);

// Player validates code (public)
router.post("/validate", validateAccessCode);

export default router;
