import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  generateAccessCode,
  validateAccessCode,
} from "./access-code.controller";

const router = Router();

// Owner generates code (protected)
router.post("/generate", authMiddleware, generateAccessCode);

// Player validates code (public)
router.post("/validate", validateAccessCode);

export default router;
