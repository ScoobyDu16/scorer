import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireScorer } from "../../middleware/role.middleware";
import { acquireLock, releaseLock, checkLock, extendLock } from "./scoring-lock.controller";

const router = Router();

// All routes require authentication and scorer role
router.use(authMiddleware);
router.use(requireScorer);

router.post("/:matchId/lock", acquireLock);
router.delete("/:matchId/lock", releaseLock);
router.get("/:matchId/lock", checkLock);
router.put("/:matchId/lock", extendLock);

export default router;
