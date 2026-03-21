import { db } from "../../db/client";
import { users, turfs, matches, roles, userRoles, players, subscriptions, plans } from "../../db/schema";
import { eq, and, count, sum, desc, sql, gte, lte } from "drizzle-orm";
import { AuthRequest, UserRole } from "../../middleware/auth.middleware";

export interface DashboardData {
  user: {
    id: string;
    name: string;
    role: UserRole;
    turfId?: string;
    turfName?: string;
  };
  stats: any;
  recentActivity?: any[];
  quickActions?: string[];
}

/**
 * Super Admin Dashboard - Platform-wide metrics
 */
export const getSuperAdminDashboard = async (userId: string): Promise<DashboardData> => {
  try {
    // Get user info
    const user = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Platform stats
    const [
      totalTurfs,
      activeSubscriptions,
      totalMatches,
      totalPlayers,
      pendingVerifications,
    ] = await Promise.all([
      db.select({ count: count() }).from(turfs).where(eq(turfs.isActive, true)),
      db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, "ACTIVE")),
      db.select({ count: count() }).from(matches),
      db.select({ count: count() }).from(players),
      db.select({ count: count() }).from(turfs).where(eq(turfs.verificationStatus, "PENDING")),
    ]);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const recentMatches = await db
      .select({
        id: matches.id,
        teamAName: matches.teamAName,
        teamBName: matches.teamBName,
        status: matches.status,
        createdAt: matches.createdAt,
        turfName: turfs.name,
      })
      .from(matches)
      .innerJoin(turfs, eq(matches.turfId, turfs.id))
      .where(gte(matches.createdAt, sevenDaysAgo))
      .orderBy(desc(matches.createdAt))
      .limit(5);

    const recentTurfs = await db
      .select({
        id: turfs.id,
        name: turfs.name,
        verificationStatus: turfs.verificationStatus,
        createdAt: turfs.createdAt,
      })
      .from(turfs)
      .where(gte(turfs.createdAt, sevenDaysAgo))
      .orderBy(desc(turfs.createdAt))
      .limit(5);

    return {
      user: {
        id: userId,
        name: user[0]?.name || "Super Admin",
        role: "SUPER_ADMIN",
      },
      stats: {
        totalTurfs: totalTurfs[0]?.count || 0,
        activeSubscriptions: activeSubscriptions[0]?.count || 0,
        totalMatches: totalMatches[0]?.count || 0,
        totalPlayers: totalPlayers[0]?.count || 0,
        pendingVerifications: pendingVerifications[0]?.count || 0,
      },
      recentActivity: [
        ...recentMatches.map(m => ({
          type: "match",
          title: `${m.teamAName} vs ${m.teamBName}`,
          subtitle: m.turfName,
          timestamp: m.createdAt,
          status: m.status,
        })),
        ...recentTurfs.map(t => ({
          type: "turf",
          title: t.name,
          subtitle: `Status: ${t.verificationStatus}`,
          timestamp: t.createdAt,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10),
      quickActions: [
        "Verify Turfs",
        "Manage Subscriptions", 
        "View Platform Stats",
        "Manage Users",
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to load super admin dashboard: ${error.message}`);
  }
};

/**
 * Turf Admin Dashboard - Turf-specific metrics
 */
export const getTurfAdminDashboard = async (userId: string, turfId: string): Promise<DashboardData> => {
  try {
    // Get user and turf info
    const [userInfo, turfInfo] = await Promise.all([
      db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1),
      db.select({ name: turfs.name, subscriptionStatus: turfs.subscriptionStatus }).from(turfs).where(eq(turfs.id, turfId)).limit(1),
    ]);

    // Turf stats
    const [
      totalPlayers,
      totalMatches,
      activeMatches,
      totalScorers,
    ] = await Promise.all([
      db.select({ count: count() }).from(players).where(eq(players.turfId, turfId)),
      db.select({ count: count() }).from(matches).where(eq(matches.turfId, turfId)),
      db.select({ count: count() }).from(matches).where(and(
        eq(matches.turfId, turfId),
        sql`${matches.status} != 'COMPLETED'`
      )),
      db.select({ count: count() })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(
          eq(userRoles.turfId, turfId),
          eq(roles.name, "SCORER")
        )),
    ]);

    // Recent matches
    const recentMatches = await db
      .select({
        id: matches.id,
        teamAName: matches.teamAName,
        teamBName: matches.teamBName,
        status: matches.status,
        createdAt: matches.createdAt,
      })
      .from(matches)
      .where(eq(matches.turfId, turfId))
      .orderBy(desc(matches.createdAt))
      .limit(5);

    // Top players (by runs)
    const topPlayers = await db
      .select({
        playerId: players.id,
        name: players.name,
        totalRuns: sum(sql`COALESCE(${playerMatchStats.runs}, 0)`),
      })
      .from(players)
      .leftJoin(playerMatchStats, eq(players.id, playerMatchStats.playerId))
      .where(eq(players.turfId, turfId))
      .groupBy(players.id, players.name)
      .orderBy(desc(sum(sql`COALESCE(${playerMatchStats.runs}, 0)`)))
      .limit(5);

    return {
      user: {
        id: userId,
        name: userInfo[0]?.name || "Turf Admin",
        role: "TURF_ADMIN",
        turfId,
        turfName: turfInfo[0]?.name,
      },
      stats: {
        totalPlayers: totalPlayers[0]?.count || 0,
        totalMatches: totalMatches[0]?.count || 0,
        activeMatches: activeMatches[0]?.count || 0,
        totalScorers: totalScorers[0]?.count || 0,
        subscriptionStatus: turfInfo[0]?.subscriptionStatus,
      },
      recentActivity: recentMatches.map(m => ({
        type: "match",
        title: `${m.teamAName} vs ${m.teamBName}`,
        subtitle: `Status: ${m.status}`,
        timestamp: m.createdAt,
        matchId: m.id,
      })),
      quickActions: [
        "Create Match",
        "Add Player",
        "Manage Scorers",
        "View Reports",
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to load turf admin dashboard: ${error.message}`);
  }
};

/**
 * Scorer Dashboard - Match operations focus
 */
export const getScorerDashboard = async (userId: string, turfId: string): Promise<DashboardData> => {
  try {
    // Get user and turf info
    const [userInfo, turfInfo] = await Promise.all([
      db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1),
      db.select({ name: turfs.name }).from(turfs).where(eq(turfs.id, turfId)).limit(1),
    ]);

    // Scorer stats
    const [
      totalMatchesScored,
      activeScoringLocks,
      recentMatches,
    ] = await Promise.all([
      db.select({ count: count() })
        .from(matches)
        .where(and(
          eq(matches.turfId, turfId),
          eq(matches.activeScorerId, userId)
        )),
      db.select({ count: count() })
        .from(matches)
        .where(and(
          eq(matches.turfId, turfId),
          eq(matches.activeScorerId, userId),
          sql`${matches.lockExpiresAt} > NOW()`
        )),
      db.select({
        id: matches.id,
        teamAName: matches.teamAName,
        teamBName: matches.teamBName,
        status: matches.status,
        createdAt: matches.createdAt,
        isLocked: sql<boolean>`(${matches.activeScorerId} = ${userId} AND ${matches.lockExpiresAt} > NOW())`,
      })
        .from(matches)
        .where(eq(matches.turfId, turfId))
        .orderBy(desc(matches.createdAt))
        .limit(10),
    ]);

    return {
      user: {
        id: userId,
        name: userInfo[0]?.name || "Scorer",
        role: "SCORER",
        turfId,
        turfName: turfInfo[0]?.name,
      },
      stats: {
        totalMatchesScored: totalMatchesScored[0]?.count || 0,
        activeScoringLocks: activeScoringLocks[0]?.count || 0,
        availableMatches: recentMatches.filter(m => !m.isLocked).length,
      },
      recentActivity: recentMatches.map(m => ({
        type: "match",
        title: `${m.teamAName} vs ${m.teamBName}`,
        subtitle: m.isLocked ? "Currently scoring" : `Status: ${m.status}`,
        timestamp: m.createdAt,
        matchId: m.id,
        isLocked: m.isLocked,
      })),
      quickActions: [
        "Start Scoring",
        "View Scorecards",
        "Match Schedule",
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to load scorer dashboard: ${error.message}`);
  }
};

/**
 * Player Dashboard - Consumer view
 */
export const getPlayerDashboard = async (userId: string): Promise<DashboardData> => {
  try {
    // Get user info
    const user = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Player stats (assuming user is also a player)
    const [
      playerInfo,
      totalRuns,
      totalWickets,
      recentMatches,
    ] = await Promise.all([
      db.select({ turfId: players.turfId, turfName: turfs.name })
        .from(players)
        .leftJoin(turfs, eq(players.turfId, turfs.id))
        .where(eq(players.id, userId))
        .limit(1),
      db.select({ total: sum(sql`COALESCE(${playerMatchStats.runs}, 0)`) })
        .from(playerMatchStats)
        .where(eq(playerMatchStats.playerId, userId)),
      db.select({ total: sum(sql`COALESCE(${playerMatchStats.wickets}, 0)`) })
        .from(playerMatchStats)
        .where(eq(playerMatchStats.playerId, userId)),
      db.select({
        id: matches.id,
        teamAName: matches.teamAName,
        teamBName: matches.teamBName,
        status: matches.status,
        createdAt: matches.createdAt,
        runs: playerMatchStats.runs,
        wickets: playerMatchStats.wickets,
      })
        .from(matches)
        .innerJoin(playerMatchStats, eq(matches.id, playerMatchStats.matchId))
        .where(eq(playerMatchStats.playerId, userId))
        .orderBy(desc(matches.createdAt))
        .limit(5),
    ]);

    return {
      user: {
        id: userId,
        name: user[0]?.name || "Player",
        role: "PLAYER",
        turfId: playerInfo[0]?.turfId,
        turfName: playerInfo[0]?.turfName,
      },
      stats: {
        totalRuns: totalRuns[0]?.total || 0,
        totalWickets: totalWickets[0]?.total || 0,
        matchesPlayed: recentMatches.length,
      },
      recentActivity: recentMatches.map(m => ({
        type: "match",
        title: `${m.teamAName} vs ${m.teamBName}`,
        subtitle: `${m.runs || 0} runs, ${m.wickets || 0} wickets`,
        timestamp: m.createdAt,
        matchId: m.id,
      })),
      quickActions: [
        "View Career Stats",
        "View Scorecards",
        "Leaderboards",
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to load player dashboard: ${error.message}`);
  }
};

/**
 * Unified dashboard function that routes to appropriate dashboard based on user role
 */
export const getDashboardData = async (req: AuthRequest): Promise<DashboardData> => {
  const { userId, role, turfId } = req;

  if (!userId || !role) {
    throw new Error("Authentication required");
  }

  switch (role) {
    case "SUPER_ADMIN":
      return getSuperAdminDashboard(userId);
    
    case "TURF_ADMIN":
      if (!turfId) {
        throw new Error("Turf ID required for turf admin");
      }
      return getTurfAdminDashboard(userId, turfId);
    
    case "SCORER":
      if (!turfId) {
        throw new Error("Turf ID required for scorer");
      }
      return getScorerDashboard(userId, turfId);
    
    case "PLAYER":
      return getPlayerDashboard(userId);
    
    default:
      throw new Error("Invalid user role");
  }
};

// Import for playerMatchStats
import { playerMatchStats } from "../../db/schema";
