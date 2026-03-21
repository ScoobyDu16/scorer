import { db } from "../../db/client";
import { matches } from "../../db/schema";
import { eq, and, gt } from "drizzle-orm";
import { AuthRequest } from "../../middleware/auth.middleware";

export interface ScoringLockResult {
  success: boolean;
  message: string;
  lockInfo?: {
    scorerId: string;
    sessionId: string;
    expiresAt: Date;
  };
}

/**
 * Acquire scoring lock for a match
 */
export const acquireScoringLock = async (
  matchId: string,
  scorerId: string,
  sessionId: string
): Promise<ScoringLockResult> => {
  try {
    // Check if match exists
    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match.length) {
      return { success: false, message: "Match not found" };
    }

    const currentMatch = match[0];

    // Check if match is already locked by another scorer
    if (currentMatch.activeScorerId && currentMatch.lockExpiresAt) {
      // Check if lock is still valid
      if (new Date() < new Date(currentMatch.lockExpiresAt)) {
        // Lock is still active
        if (currentMatch.activeScorerId === scorerId) {
          // Same scorer, extend the lock
          const newExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
          
          await db
            .update(matches)
            .set({
              lockExpiresAt: newExpiresAt,
              updatedAt: new Date(),
            })
            .where(eq(matches.id, matchId));

          return {
            success: true,
            message: "Lock extended successfully",
            lockInfo: {
              scorerId,
              sessionId,
              expiresAt: newExpiresAt,
            },
          };
        } else {
          // Different scorer has the lock
          return {
            success: false,
            message: "Match is being scored by another user",
            lockInfo: {
              scorerId: currentMatch.activeScorerId!,
              sessionId: currentMatch.scorerSessionId!,
              expiresAt: new Date(currentMatch.lockExpiresAt),
            },
          };
        }
      }
      // Lock has expired, can acquire new lock
    }

    // Acquire new lock
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    await db
      .update(matches)
      .set({
        activeScorerId: scorerId,
        scorerSessionId: sessionId,
        lockExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, matchId));

    return {
      success: true,
      message: "Scoring lock acquired successfully",
      lockInfo: {
        scorerId,
        sessionId,
        expiresAt,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to acquire scoring lock: ${error.message}`,
    };
  }
};

/**
 * Release scoring lock for a match
 */
export const releaseScoringLock = async (
  matchId: string,
  scorerId: string,
  sessionId: string
): Promise<ScoringLockResult> => {
  try {
    // Check if match exists and is locked by this scorer
    const match = await db
      .select()
      .from(matches)
      .where(and(
        eq(matches.id, matchId),
        eq(matches.activeScorerId, scorerId),
        eq(matches.scorerSessionId, sessionId)
      ))
      .limit(1);

    if (!match.length) {
      return { success: false, message: "No active scoring lock found" };
    }

    // Release the lock
    await db
      .update(matches)
      .set({
        activeScorerId: null,
        scorerSessionId: null,
        lockExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, matchId));

    return { success: true, message: "Scoring lock released successfully" };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to release scoring lock: ${error.message}`,
    };
  }
};

/**
 * Check scoring lock status for a match
 */
export const checkScoringLock = async (matchId: string): Promise<ScoringLockResult> => {
  try {
    const match = await db
      .select({
        activeScorerId: matches.activeScorerId,
        scorerSessionId: matches.scorerSessionId,
        lockExpiresAt: matches.lockExpiresAt,
      })
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match.length) {
      return { success: false, message: "Match not found" };
    }

    const lockInfo = match[0];

    if (!lockInfo.activeScorerId || !lockInfo.lockExpiresAt) {
      return { success: true, message: "No active scoring lock" };
    }

    // Check if lock is still valid
    if (new Date() < new Date(lockInfo.lockExpiresAt)) {
      return {
        success: true,
        message: "Match is currently locked",
        lockInfo: {
          scorerId: lockInfo.activeScorerId!,
          sessionId: lockInfo.scorerSessionId!,
          expiresAt: new Date(lockInfo.lockExpiresAt),
        },
      };
    } else {
      // Lock has expired, clean it up
      await db
        .update(matches)
        .set({
          activeScorerId: null,
          scorerSessionId: null,
          lockExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(matches.id, matchId));

      return { success: true, message: "Previous lock has expired" };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to check scoring lock: ${error.message}`,
    };
  }
};

/**
 * Extend scoring lock (heartbeat)
 */
export const extendScoringLock = async (
  matchId: string,
  scorerId: string,
  sessionId: string
): Promise<ScoringLockResult> => {
  try {
    // Check if match is locked by this scorer
    const match = await db
      .select()
      .from(matches)
      .where(and(
        eq(matches.id, matchId),
        eq(matches.activeScorerId, scorerId),
        eq(matches.scorerSessionId, sessionId)
      ))
      .limit(1);

    if (!match.length) {
      return { success: false, message: "No active scoring lock found" };
    }

    // Extend the lock
    const newExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    await db
      .update(matches)
      .set({
        lockExpiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, matchId));

    return {
      success: true,
      message: "Scoring lock extended successfully",
      lockInfo: {
        scorerId,
        sessionId,
        expiresAt: newExpiresAt,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to extend scoring lock: ${error.message}`,
    };
  }
};

/**
 * Middleware to check if user has scoring lock for the match
 */
export const requireScoringLock = (req: AuthRequest, res: any, next: any) => {
  const { matchId } = req.params;
  const userId = req.userId;
  const sessionId = req.headers['x-scoring-session'] as string;

  if (!matchId || !userId || !sessionId) {
    return res.status(400).json({ 
      message: "Match ID, user ID, and session ID are required" 
    });
  }

  const matchIdStr = Array.isArray(matchId) ? matchId[0] : matchId;

  // Check scoring lock
  checkScoringLock(matchIdStr).then((result) => {
    if (!result.success) {
      return res.status(500).json({ message: result.message });
    }

    if (result.lockInfo && result.lockInfo.scorerId !== userId) {
      return res.status(403).json({ 
        message: "Match is being scored by another user",
        lockInfo: result.lockInfo 
      });
    }

    // User has the lock or no lock exists, proceed
    next();
  });
};
