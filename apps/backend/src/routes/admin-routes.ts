import { Router, Response } from "express";
import { db } from "../db";
import { turfs, users, subscriptions, plans, matches } from "../db/schema";
import { eq, count, and, gte, lte, sql } from "drizzle-orm";
import { AuthenticatedRequest, authenticateToken, requireSuperAdmin } from "../middleware/auth";

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Dashboard statistics
router.get("/dashboard/stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get total counts
    const [
      totalTurfs,
      activeSubscriptions,
      totalUsers,
      todayMatches,
    ] = await Promise.all([
      // Total turfs
      db.select({ count: count() }).from(turfs),
      
      // Active subscriptions
      db.select({ count: count() })
        .from(subscriptions)
        .where(sql`status = 'ACTIVE'`),
      
      // Total users
      db.select({ count: count() }).from(users),
      
      // Today's matches
      db.select({ count: count() })
        .from(matches)
        .where(and(
          gte(matches.createdAt, new Date(new Date().setHours(0, 0, 0, 0))),
          lte(matches.createdAt, new Date(new Date().setHours(23, 59, 59, 999)))
        )),
    ]);

    // Get recent activity
    const recentTurfs = await db
      .select({
        id: turfs.id,
        name: turfs.name,
        email: turfs.email,
        verificationStatus: turfs.verificationStatus,
        createdAt: turfs.createdAt,
      })
      .from(turfs)
      .orderBy(turfs.createdAt)
      .limit(5);

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
      .orderBy(matches.createdAt)
      .limit(5);

    res.json({
      stats: {
        totalTurfs: totalTurfs[0].count,
        activeSubscriptions: activeSubscriptions[0].count,
        totalUsers: totalUsers[0].count,
        todayMatches: todayMatches[0].count,
      },
      recentActivity: {
        recentTurfs,
        recentMatches,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

// Get all turfs with pagination
router.get("/turfs", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = "1", limit = "10" } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const limitNum = parseInt(limit as string);

    const [turfsData, totalCount] = await Promise.all([
      db
        .select({
          id: turfs.id,
          name: turfs.name,
          email: turfs.email,
          phone: turfs.phone,
          verificationStatus: turfs.verificationStatus,
          subscriptionStatus: turfs.subscriptionStatus,
          createdAt: turfs.createdAt,
          verifiedAt: turfs.verifiedAt,
        })
        .from(turfs)
        .orderBy(turfs.createdAt)
        .limit(limitNum)
        .offset(offset),
      
      db.select({ count: count() }).from(turfs),
    ]);

    res.json({
      turfs: turfsData,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limitNum),
      },
    });
  } catch (error) {
    console.error("Get turfs error:", error);
    res.status(500).json({ error: "Failed to fetch turfs" });
  }
});

// Get turf details
router.get("/turfs/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const turfId = Array.isArray(id) ? id[0] : id;

    const turf = await db
      .select()
      .from(turfs)
      .where(eq(turfs.id, turfId))
      .limit(1);

    if (turf.length === 0) {
      return res.status(404).json({ error: "Turf not found" });
    }

    // Get subscription details
    const subscription = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        trialEndsAt: subscriptions.trialEndsAt,
        plan: {
          name: plans.name,
          priceMonthly: plans.priceMonthly,
          priceYearly: plans.priceYearly,
        },
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.turfId, turfId))
      .limit(1);

    res.json({
      turf: turf[0],
      subscription: subscription[0] || null,
    });
  } catch (error) {
    console.error("Get turf details error:", error);
    res.status(500).json({ error: "Failed to fetch turf details" });
  }
});

// Update turf verification status
router.patch("/turfs/:id/verification", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const turfId = Array.isArray(id) ? id[0] : id;

    if (!["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"].includes(status)) {
      return res.status(400).json({ error: "Invalid verification status" });
    }

    const updateData: any = {
      verificationStatus: status,
    };

    if (status === "VERIFIED") {
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = req.user?.id;
    }

    const updatedTurf = await db
      .update(turfs)
      .set(updateData)
      .where(eq(turfs.id, turfId))
      .returning();

    if (updatedTurf.length === 0) {
      return res.status(404).json({ error: "Turf not found" });
    }

    res.json({
      message: `Turf verification status updated to ${status}`,
      turf: updatedTurf[0],
    });
  } catch (error) {
    console.error("Update turf verification error:", error);
    res.status(500).json({ error: "Failed to update turf verification status" });
  }
});

// Get all subscriptions
router.get("/subscriptions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = "1", limit = "10" } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const limitNum = parseInt(limit as string);

    const [subscriptionsData, totalCount] = await Promise.all([
      db
        .select({
          id: subscriptions.id,
          status: subscriptions.status,
          startDate: subscriptions.startDate,
          endDate: subscriptions.endDate,
          trialEndsAt: subscriptions.trialEndsAt,
          turf: {
            id: turfs.id,
            name: turfs.name,
            email: turfs.email,
          },
          plan: {
            id: plans.id,
            name: plans.name,
            priceMonthly: plans.priceMonthly,
            priceYearly: plans.priceYearly,
          },
        })
        .from(subscriptions)
        .innerJoin(turfs, eq(subscriptions.turfId, turfs.id))
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .orderBy(subscriptions.createdAt)
        .limit(limitNum)
        .offset(offset),
      
      db.select({ count: count() }).from(subscriptions),
    ]);

    res.json({
      subscriptions: subscriptionsData,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limitNum),
      },
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

export default router;
