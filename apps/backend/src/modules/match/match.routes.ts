import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { createMatch } from "./match.controller";

const router = Router();

// Owner creates match
router.post("/", authMiddleware, createMatch);

export default router;
