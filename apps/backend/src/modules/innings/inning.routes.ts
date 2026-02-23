import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { changeBowler } from "../match/match.controller";

const router = Router();

router.post("/:inningsId/change-bowler", authMiddleware, changeBowler);

export default router;
