import { Router } from "express";
import { AuthenticatedRequest, authenticateToken, requireTurfAdmin } from "../../middleware/auth";
import {
  generateAccessCode,
  validateAccessCode,
} from "./access-code.controller";

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Owner generates code (TURF_ADMIN only)
router.post("/generate", requireTurfAdmin, generateAccessCode);

// Player validates code (public - no auth required)
router.post("/validate", validateAccessCode);

export default router;
