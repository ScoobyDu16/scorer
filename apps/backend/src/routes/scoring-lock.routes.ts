import { Router, Response } from "express";
import { AuthenticatedRequest, authenticateToken, requireScorer, requireSuperAdmin } from "../middleware/auth";
import { ScoringLockService } from "../services/scoring-lock.service";

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * Acquire scoring lock for a match
 * Only SCORER role can acquire locks
 */
router.post("/acquire", requireScorer, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { matchId } = req.body;

    if (!matchId) {
      return res.status(400).json({ error: "Match ID is required" });
    }

    if (!req.user?.id) {
      return res.status(401).json({ error: "User ID not found" });
    }

    const result = await ScoringLockService.acquireLock(matchId, req.user.id, req);

    if (result.success) {
      res.status(200).json({
        message: result.message,
        lockId: result.lockId,
      });
    } else {
      res.status(409).json({
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Acquire lock error:", error);
    res.status(500).json({ error: "Failed to acquire scoring lock" });
  }
});

/**
 * Release scoring lock for a match
 * Only the scorer who acquired the lock can release it
 */
router.post("/release", requireScorer, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { matchId } = req.body;

    if (!matchId) {
      return res.status(400).json({ error: "Match ID is required" });
    }

    if (!req.user?.id) {
      return res.status(401).json({ error: "User ID not found" });
    }

    const result = await ScoringLockService.releaseLock(matchId, req.user.id);

    if (result.success) {
      res.status(200).json({
        message: result.message,
      });
    } else {
      res.status(400).json({
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Release lock error:", error);
    res.status(500).json({ error: "Failed to release scoring lock" });
  }
});

/**
 * Update lock activity (extends lock duration)
 * Only the scorer who owns the lock can update it
 */
router.post("/update-activity", requireScorer, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { matchId } = req.body;

    if (!matchId) {
      return res.status(400).json({ error: "Match ID is required" });
    }

    if (!req.user?.id) {
      return res.status(401).json({ error: "User ID not found" });
    }

    const result = await ScoringLockService.updateActivity(matchId, req.user.id);

    if (result.success) {
      res.status(200).json({
        message: result.message,
      });
    } else {
      res.status(400).json({
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Update activity error:", error);
    res.status(500).json({ error: "Failed to update lock activity" });
  }
});

/**
 * Check if user has lock for a match
 */
router.get("/has-lock/:matchId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;

    if (!req.user?.id) {
      return res.status(401).json({ error: "User ID not found" });
    }

    const hasLock = await ScoringLockService.hasLock(matchId, req.user.id);

    res.status(200).json({
      hasLock,
      matchId,
      userId: req.user.id,
    });
  } catch (error) {
    console.error("Check lock error:", error);
    res.status(500).json({ error: "Failed to check lock status" });
  }
});

/**
 * Get lock information for a match
 * Shows who currently has the lock
 */
router.get("/info/:matchId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;

    const result = await ScoringLockService.getLockInfo(matchId);

    res.status(200).json({
      message: result.message,
      lock: result.lock,
    });
  } catch (error) {
    console.error("Get lock info error:", error);
    res.status(500).json({ error: "Failed to get lock information" });
  }
});

/**
 * Force release lock (SUPER_ADMIN only)
 * Used to resolve stuck locks
 */
router.post("/force-release/:matchId", requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;

    const result = await ScoringLockService.forceReleaseLock(matchId);

    if (result.success) {
      res.status(200).json({
        message: result.message,
      });
    } else {
      res.status(400).json({
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Force release lock error:", error);
    res.status(500).json({ error: "Failed to force release lock" });
  }
});

export default router;
