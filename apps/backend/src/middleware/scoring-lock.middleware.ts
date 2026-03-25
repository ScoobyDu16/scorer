import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest, authenticateToken } from "./auth";
import { ScoringLockService } from "../services/scoring-lock.service";

/**
 * Middleware to ensure user has scoring lock before allowing scoring operations
 */
export const requireScoringLock = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract matchId from request parameters
    const matchId = req.params.matchId || req.body.matchId;

    if (!matchId) {
      return res.status(400).json({
        error: "Match ID is required",
        code: "MATCH_ID_REQUIRED"
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED"
      });
    }

    // Check if user has active lock for this match
    const hasLock = await ScoringLockService.hasLock(matchId, req.user.id);

    if (!hasLock) {
      // Check if someone else has the lock
      const lockInfo = await ScoringLockService.getLockInfo(matchId);
      
      if (lockInfo.lock) {
        return res.status(409).json({
          error: "Scoring lock required",
          code: "LOCK_REQUIRED",
          message: "This match is currently being scored by another scorer",
          lockInfo: {
            lockedBy: lockInfo.lock.scorerId,
            lockedAt: lockInfo.lock.lockAcquiredAt,
            expiresAt: lockInfo.lock.lockExpiresAt
          }
        });
      } else {
        return res.status(409).json({
          error: "Scoring lock required",
          code: "LOCK_REQUIRED",
          message: "You must acquire a scoring lock before performing scoring operations",
          action: "POST /api/scoring-locks/acquire"
        });
      }
    }

    // Update lock activity to extend timeout
    await ScoringLockService.updateActivity(matchId, req.user.id);

    next();
  } catch (error) {
    console.error("Scoring lock middleware error:", error);
    return res.status(500).json({
      error: "Failed to verify scoring lock",
      code: "LOCK_CHECK_FAILED"
    });
  }
};

/**
 * Middleware to ensure no scoring lock exists (for operations that can't be done while scoring)
 */
export const requireNoScoringLock = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const matchId = req.params.matchId || req.body.matchId;

    if (!matchId) {
      return res.status(400).json({
        error: "Match ID is required",
        code: "MATCH_ID_REQUIRED"
      });
    }

    // Check if any active lock exists for this match
    const lockInfo = await ScoringLockService.getLockInfo(matchId);

    if (lockInfo.lock) {
      return res.status(409).json({
        error: "Match is currently being scored",
        code: "MATCH_IN_PROGRESS",
        message: "This operation cannot be performed while the match is being scored",
        lockInfo: {
          lockedBy: lockInfo.lock.scorerId,
          lockedAt: lockInfo.lock.lockAcquiredAt,
          expiresAt: lockInfo.lock.lockExpiresAt
        }
      });
    }

    next();
  } catch (error) {
    console.error("No scoring lock middleware error:", error);
    return res.status(500).json({
      error: "Failed to verify match status",
      code: "STATUS_CHECK_FAILED"
    });
  }
};
