import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { createPlayer, getPlayers } from "./player.controller";

const router = Router();

router.post("/", authMiddleware, createPlayer);
router.get("/", authMiddleware, getPlayers);

export default router;
