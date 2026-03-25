import { db } from "../db";
import { scoringLocks } from "../db/schema";
import { eq, and, gt, lt, or } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth";

export class ScoringLockService {
  private static readonly LOCK_DURATION_MINUTES = 30; // 30 minutes
  private static readonly ACTIVITY_TIMEOUT_MINUTES = 5; // 5 minutes of inactivity

  /**
   * Acquire a scoring lock for a match
   */
  static async acquireLock(
    matchId: string,
    scorerId: string,
    req: AuthenticatedRequest
  ): Promise<{ success: boolean; message: string; lockId?: string }> {
    try {
      // Clean up expired locks first
      await this.cleanupExpiredLocks();

      // Check if there's an active lock for this match
      const existingLock = await db
        .select()
        .from(scoringLocks)
        .where(
          and(
            eq(scoringLocks.matchId, matchId),
            eq(scoringLocks.isActive, true),
            gt(scoringLocks.lockExpiresAt, new Date())
          )
        )
        .limit(1);

      if (existingLock.length > 0) {
        const lock = existingLock[0];
        if (!lock) {
          return {
            success: false,
            message: "Lock information unavailable",
          };
        }
        
        const timeRemaining = Math.floor(
          (new Date(lock.lockExpiresAt).getTime() - new Date().getTime()) / (1000 * 60)
        );

        return {
          success: false,
          message: `Match is currently being scored by another scorer. Lock expires in ${timeRemaining} minutes.`,
        };
      }

      // Create new lock
      const lockExpiresAt = new Date();
      lockExpiresAt.setMinutes(lockExpiresAt.getMinutes() + this.LOCK_DURATION_MINUTES);

      const [newLock] = await db
        .insert(scoringLocks)
        .values({
          matchId,
          scorerId,
          lockExpiresAt,
          isActive: true,
          userAgent: req.get("User-Agent"),
          ipAddress: req.ip,
        })
        .returning();

      if (!newLock) {
        return {
          success: false,
          message: "Failed to create scoring lock",
        };
      }

      console.log(`🔒 Scoring lock acquired for match ${matchId} by scorer ${scorerId}`);

      return {
        success: true,
        message: "Scoring lock acquired successfully",
        lockId: newLock.id,
      };
    } catch (error) {
      console.error("Error acquiring scoring lock:", error);
      return {
        success: false,
        message: "Failed to acquire scoring lock",
      };
    }
  }

  /**
   * Release a scoring lock
   */
  static async releaseLock(
    matchId: string,
    scorerId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await db
        .update(scoringLocks)
        .set({
          isActive: false,
        })
        .where(
          and(
            eq(scoringLocks.matchId, matchId),
            eq(scoringLocks.scorerId, scorerId),
            eq(scoringLocks.isActive, true)
          )
        );

      if (result.rowCount === 0) {
        return {
          success: false,
          message: "No active scoring lock found for this match",
        };
      }

      console.log(`🔓 Scoring lock released for match ${matchId} by scorer ${scorerId}`);

      return {
        success: true,
        message: "Scoring lock released successfully",
      };
    } catch (error) {
      console.error("Error releasing scoring lock:", error);
      return {
        success: false,
        message: "Failed to release scoring lock",
      };
    }
  }

  /**
   * Update lock activity (extend lock if needed)
   */
  static async updateActivity(
    matchId: string,
    scorerId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const lock = await db
        .select()
        .from(scoringLocks)
        .where(
          and(
            eq(scoringLocks.matchId, matchId),
            eq(scoringLocks.scorerId, scorerId),
            eq(scoringLocks.isActive, true)
          )
        )
        .limit(1);

      if (lock.length === 0) {
        return {
          success: false,
          message: "No active scoring lock found",
        };
      }

      const existingLock = lock[0];
      if (!existingLock) {
        return {
          success: false,
          message: "Lock information unavailable",
        };
      }

      // Update last activity and extend lock if needed
      const now = new Date();
      const lockExpiresAt = new Date(now);
      lockExpiresAt.setMinutes(lockExpiresAt.getMinutes() + this.LOCK_DURATION_MINUTES);

      await db
        .update(scoringLocks)
        .set({
          lastActivityAt: now,
          lockExpiresAt,
        })
        .where(eq(scoringLocks.id, existingLock.id));

      return {
        success: true,
        message: "Lock activity updated",
      };
    } catch (error) {
      console.error("Error updating lock activity:", error);
      return {
        success: false,
        message: "Failed to update lock activity",
      };
    }
  }

  /**
   * Check if user has active lock for match
   */
  static async hasLock(
    matchId: string,
    scorerId: string
  ): Promise<boolean> {
    try {
      const lock = await db
        .select()
        .from(scoringLocks)
        .where(
          and(
            eq(scoringLocks.matchId, matchId),
            eq(scoringLocks.scorerId, scorerId),
            eq(scoringLocks.isActive, true),
            gt(scoringLocks.lockExpiresAt, new Date())
          )
        )
        .limit(1);

      return lock.length > 0;
    } catch (error) {
      console.error("Error checking lock:", error);
      return false;
    }
  }

  /**
   * Get active lock info for a match
   */
  static async getLockInfo(
    matchId: string
  ): Promise<{ lock: any | null; message: string }> {
    try {
      const [lock] = await db
        .select({
          id: scoringLocks.id,
          scorerId: scoringLocks.scorerId,
          lockAcquiredAt: scoringLocks.lockAcquiredAt,
          lockExpiresAt: scoringLocks.lockExpiresAt,
          lastActivityAt: scoringLocks.lastActivityAt,
          userAgent: scoringLocks.userAgent,
          ipAddress: scoringLocks.ipAddress,
        })
        .from(scoringLocks)
        .where(
          and(
            eq(scoringLocks.matchId, matchId),
            eq(scoringLocks.isActive, true),
            gt(scoringLocks.lockExpiresAt, new Date())
          )
        )
        .limit(1);

      if (!lock) {
        return {
          lock: null,
          message: "No active lock found for this match",
        };
      }

      return {
        lock,
        message: "Active lock found",
      };
    } catch (error) {
      console.error("Error getting lock info:", error);
      return {
        lock: null,
        message: "Failed to get lock information",
      };
    }
  }

  /**
   * Clean up expired locks
   */
  private static async cleanupExpiredLocks(): Promise<void> {
    try {
      await db
        .update(scoringLocks)
        .set({
          isActive: false,
        })
        .where(
          or(
            lt(scoringLocks.lockExpiresAt, new Date()),
            and(
              lt(scoringLocks.lastActivityAt, new Date(Date.now() - this.ACTIVITY_TIMEOUT_MINUTES * 60 * 1000)),
              eq(scoringLocks.isActive, true)
            )
          )
        );

      console.log("🧹 Cleaned up expired scoring locks");
    } catch (error) {
      console.error("Error cleaning up expired locks:", error);
    }
  }

  /**
   * Force release lock (admin only)
   */
  static async forceReleaseLock(
    matchId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await db
        .update(scoringLocks)
        .set({
          isActive: false,
        })
        .where(
          and(
            eq(scoringLocks.matchId, matchId),
            eq(scoringLocks.isActive, true)
          )
        );

      if (result.rowCount === 0) {
        return {
          success: false,
          message: "No active scoring lock found for this match",
        };
      }

      console.log(`🔓 Force released scoring lock for match ${matchId}`);

      return {
        success: true,
        message: "Scoring lock force released successfully",
      };
    } catch (error) {
      console.error("Error force releasing lock:", error);
      return {
        success: false,
        message: "Failed to force release scoring lock",
      };
    }
  }
}
