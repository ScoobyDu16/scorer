import { Router, Response } from "express";
import { db } from "../db";
import { users, turfs, subscriptions, plans, matches } from "../db/schema";
import { eq, count, and, gte, lte, sql, desc } from "drizzle-orm";
import { AuthenticatedRequest, authenticateToken, requireSuperAdmin } from "../middleware/auth";

const router = Router();

// Apply authentication and permissions
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Get platform analytics overview
router.get("/overview", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = "30" } = req.query; // days
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

    // Get overview stats
    const [
      totalUsers,
      newUsers,
      totalTurfs,
      newTurfs,
      totalSubscriptions,
      activeSubscriptions,
      totalMatches,
      completedMatches,
      totalRevenue,
    ] = await Promise.all([
      // Total users
      db.select({ count: count() }).from(users),
      
      // New users in period
      db.select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, daysAgo)),
      
      // Total turfs
      db.select({ count: count() }).from(turfs),
      
      // New turfs in period
      db.select({ count: count() })
        .from(turfs)
        .where(gte(turfs.createdAt, daysAgo)),
      
      // Total subscriptions
      db.select({ count: count() }).from(subscriptions),
      
      // Active subscriptions
      db.select({ count: count() })
        .from(subscriptions)
        .where(sql`status = 'ACTIVE'`),
      
      // Total matches
      db.select({ count: count() }).from(matches),
      
      // Completed matches in period
      db.select({ count: count() })
        .from(matches)
        .where(and(
          gte(matches.createdAt, daysAgo),
          sql`status = 'COMPLETED'`
        )),
      
      // Total revenue (simplified calculation)
      db.select({ 
        total: sql<number>`SUM(CASE 
          WHEN plan_id = (SELECT id FROM plans WHERE name = 'BASIC') THEN ${plans.priceMonthly}
          WHEN plan_id = (SELECT id FROM plans WHERE name = 'PRO') THEN ${plans.priceMonthly}
          WHEN plan_id = (SELECT id FROM plans WHERE name = 'PREMIUM') THEN ${plans.priceMonthly}
          ELSE 0
        END)`
      })
        .from(subscriptions)
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(sql`status = 'ACTIVE'`),
    ]);

    res.json({
      period: `${period} days`,
      overview: {
        users: {
          total: totalUsers[0].count,
          new: newUsers[0].count,
          growth: totalUsers[0].count > 0 ? ((newUsers[0].count / totalUsers[0].count) * 100).toFixed(2) : "0",
        },
        turfs: {
          total: totalTurfs[0].count,
          new: newTurfs[0].count,
          growth: totalTurfs[0].count > 0 ? ((newTurfs[0].count / totalTurfs[0].count) * 100).toFixed(2) : "0",
        },
        subscriptions: {
          total: totalSubscriptions[0].count,
          active: activeSubscriptions[0].count,
          activationRate: totalSubscriptions[0].count > 0 ? ((activeSubscriptions[0].count / totalSubscriptions[0].count) * 100).toFixed(2) : "0",
        },
        matches: {
          total: totalMatches[0].count,
          completed: completedMatches[0].count,
          completionRate: totalMatches[0].count > 0 ? ((completedMatches[0].count / totalMatches[0].count) * 100).toFixed(2) : "0",
        },
        revenue: {
          total: totalRevenue[0].total || 0,
          currency: "INR",
        },
      },
    });
  } catch (error) {
    console.error("Analytics overview error:", error);
    res.status(500).json({ error: "Failed to fetch analytics overview" });
  }
});

// Get user registration trends
router.get("/registrations", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = "30" } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

    const registrationTrends = await db
      .select({
        date: sql<string>`DATE(${users.createdAt})`,
        count: count(),
      })
      .from(users)
      .where(gte(users.createdAt, daysAgo))
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

    res.json({
      period: `${period} days`,
      trends: registrationTrends,
    });
  } catch (error) {
    console.error("Registration trends error:", error);
    res.status(500).json({ error: "Failed to fetch registration trends" });
  }
});

// Get subscription trends
router.get("/subscriptions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = "30" } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

    const subscriptionTrends = await db
      .select({
        date: sql<string>`DATE(${subscriptions.createdAt})`,
        count: count(),
        planName: plans.name,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(gte(subscriptions.createdAt, daysAgo))
      .groupBy(sql`DATE(${subscriptions.createdAt})`, plans.name)
      .orderBy(sql`DATE(${subscriptions.createdAt})`);

    res.json({
      period: `${period} days`,
      trends: subscriptionTrends,
    });
  } catch (error) {
    console.error("Subscription trends error:", error);
    res.status(500).json({ error: "Failed to fetch subscription trends" });
  }
});

// Get match statistics
router.get("/matches", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = "30" } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

    const [
      totalMatches,
      completedMatches,
      matchesByStatus,
      matchesByTurf,
    ] = await Promise.all([
      // Total matches in period
      db.select({ count: count() })
        .from(matches)
        .where(gte(matches.createdAt, daysAgo)),
      
      // Completed matches in period
      db.select({ count: count() })
        .from(matches)
        .where(and(
          gte(matches.createdAt, daysAgo),
          sql`status = 'COMPLETED'`
        )),
      
      // Matches by status
      db.select({
        status: matches.status,
        count: count(),
      })
        .from(matches)
        .where(gte(matches.createdAt, daysAgo))
        .groupBy(matches.status),
      
      // Top turfs by matches
      db.select({
        turfId: turfs.id,
        turfName: turfs.name,
        matchCount: count(),
      })
        .from(matches)
        .innerJoin(turfs, eq(matches.turfId, turfs.id))
        .where(gte(matches.createdAt, daysAgo))
        .groupBy(turfs.id, turfs.name)
        .orderBy(desc(count()))
        .limit(10),
    ]);

    res.json({
      period: `${period} days`,
      statistics: {
        total: totalMatches[0].count,
        completed: completedMatches[0].count,
        completionRate: totalMatches[0].count > 0 ? ((completedMatches[0].count / totalMatches[0].count) * 100).toFixed(2) : "0",
        byStatus: matchesByStatus,
        topTurfs: matchesByTurf,
      },
    });
  } catch (error) {
    console.error("Match statistics error:", error);
    res.status(500).json({ error: "Failed to fetch match statistics" });
  }
});

// Get turf verification statistics
router.get("/verifications", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const verificationStats = await db
      .select({
        status: turfs.verificationStatus,
        count: count(),
      })
      .from(turfs)
      .groupBy(turfs.verificationStatus);

    const totalTurfs = verificationStats.reduce((sum, stat) => sum + stat.count, 0);

    res.json({
      total: totalTurfs,
      breakdown: verificationStats.map(stat => ({
        status: stat.status,
        count: stat.count,
        percentage: totalTurfs > 0 ? ((stat.count / totalTurfs) * 100).toFixed(2) : "0",
      })),
    });
  } catch (error) {
    console.error("Verification statistics error:", error);
    res.status(500).json({ error: "Failed to fetch verification statistics" });
  }
});

export default router;
