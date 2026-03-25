import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { changeBowler } from "../match/match.controller";

const router = Router();

router.post("/:inningsId/change-bowler", authenticateToken, changeBowler);

export default router;
