import { Router, Response } from "express";
import { db } from "../db";
import {
  turfs,
  users,
  subscriptions,
  plans,
  matches,
  userRoles,
  roles,
} from "../db/schema";
import { eq, count, and, gte, lte, sql, desc } from "drizzle-orm";
import {
  AuthenticatedRequest,
  authenticateToken,
  requireTurfAdmin,
} from "../middleware/auth";

const router = Router();

// Apply authentication and permissions
router.use(authenticateToken);
router.use(requireTurfAdmin);

// Get turf dashboard statistics
router.get(
  "/dashboard/stats",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.turfId) {
        return res.status(403).json({ error: "Turf access required" });
      }

      const turfId = req.user.turfId;

      // Get turf statistics
      const [
        turfInfo,
        totalMatches,
        activeMatches,
        todayMatches,
        completedMatches,
        totalUsers,
        activeUsers,
      ] = await Promise.all([
        // Turf information
        db.select().from(turfs).where(eq(turfs.id, turfId)).limit(1),

        // Total matches
        db
          .select({ count: count() })
          .from(matches)
          .where(eq(matches.turfId, turfId)),

        // Active matches
        db
          .select({ count: count() })
          .from(matches)
          .where(
            and(
              eq(matches.turfId, turfId),
              sql`status IN ('SCHEDULED', 'IN_PROGRESS', 'LIVE')`,
            ),
          ),

        // Today's matches
        db
          .select({ count: count() })
          .from(matches)
          .where(
            and(
              eq(matches.turfId, turfId),
              gte(matches.createdAt, new Date(new Date().setHours(0, 0, 0, 0))),
              lte(
                matches.createdAt,
                new Date(new Date().setHours(23, 59, 59, 999)),
              ),
            ),
          ),

        // Completed matches
        db
          .select({ count: count() })
          .from(matches)
          .where(and(eq(matches.turfId, turfId), sql`status = 'COMPLETED'`)),

        // Total users for this turf
        db
          .select({ count: count() })
          .from(userRoles)
          .where(eq(userRoles.turfId, turfId)),

        // Active users for this turf
        db
          .select({ count: count() })
          .from(userRoles)
          .innerJoin(users, eq(userRoles.userId, users.id))
          .where(
            and(eq(userRoles.turfId, turfId), sql`${users.status} = 'ACTIVE'`),
          ),
      ]);

      // Get recent matches
      const recentMatches = await db
        .select({
          id: matches.id,
          teamAName: matches.teamAName,
          teamBName: matches.teamBName,
          status: matches.status,
          createdAt: matches.createdAt,
          startTime: matches.startTime,
        })
        .from(matches)
        .where(eq(matches.turfId, turfId))
        .orderBy(desc(matches.createdAt))
        .limit(5);

      res.json({
        turf: turfInfo[0],
        stats: {
          matches: {
            total: totalMatches[0].count,
            active: activeMatches[0].count,
            today: todayMatches[0].count,
            completed: completedMatches[0].count,
          },
          users: {
            total: totalUsers[0].count,
            active: activeUsers[0].count,
          },
        },
        recentMatches,
      });
    } catch (error) {
      console.error("Turf dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch turf dashboard" });
    }
  },
);

// Get turf profile
router.get("/profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.turfId) {
      return res.status(403).json({ error: "Turf access required" });
    }

    const turfInfo = await db
      .select({
        id: turfs.id,
        name: turfs.name,
        email: turfs.email,
        phone: turfs.phone,
        addressLine1: turfs.addressLine1,
        city: turfs.city,
        state: turfs.state,
        pincode: turfs.pincode,
        gstNumber: turfs.gstNumber,
        verificationStatus: turfs.verificationStatus,
        subscriptionStatus: turfs.subscriptionStatus,
        createdAt: turfs.createdAt,
        verifiedAt: turfs.verifiedAt,
      })
      .from(turfs)
      .where(eq(turfs.id, req.user.turfId))
      .limit(1);

    if (turfInfo.length === 0) {
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
          id: plans.id,
          name: plans.name,
          priceMonthly: plans.priceMonthly,
          priceYearly: plans.priceYearly,
          featuresJson: plans.featuresJson,
        },
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.turfId, req.user.turfId))
      .limit(1);

    res.json({
      turf: turfInfo[0],
      subscription: subscription[0] || null,
    });
  } catch (error) {
    console.error("Get turf profile error:", error);
    res.status(500).json({ error: "Failed to fetch turf profile" });
  }
});

// Update turf profile
router.patch("/profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.turfId) {
      return res.status(403).json({ error: "Turf access required" });
    }

    const { name, phone, address, city, state, pincode, gstNumber } = req.body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (pincode) updateData.pincode = pincode;
    if (gstNumber) updateData.gstNumber = gstNumber;

    const updatedTurf = await db
      .update(turfs)
      .set(updateData)
      .where(eq(turfs.id, req.user.turfId))
      .returning();

    if (updatedTurf.length === 0) {
      return res.status(404).json({ error: "Turf not found" });
    }

    res.json({
      message: "Turf profile updated successfully",
      turf: updatedTurf[0],
    });
  } catch (error) {
    console.error("Update turf profile error:", error);
    res.status(500).json({ error: "Failed to update turf profile" });
  }
});

// Get turf matches
router.get("/matches", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.turfId) {
      return res.status(403).json({ error: "Turf access required" });
    }

    const { page = "1", limit = "10", status, search } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const limitNum = parseInt(limit as string);

    let whereConditions = [eq(matches.turfId, req.user.turfId)];

    if (status) {
      whereConditions.push(sql`status = ${status}`);
    }

    if (search) {
      whereConditions.push(
        sql`(${matches.teamAName} ILIKE ${"%" + search + "%"} OR ${matches.teamBName} ILIKE ${"%" + search + "%"})`,
      );
    }

    const [matchesData, totalCount] = await Promise.all([
      db
        .select({
          id: matches.id,
          teamAName: matches.teamAName,
          teamBName: matches.teamBName,
          status: matches.status,
          startTime: matches.startTime,
          createdAt: matches.createdAt,
        })
        .from(matches)
        .where(and(...whereConditions))
        .orderBy(desc(matches.createdAt))
        .limit(limitNum)
        .offset(offset),

      db
        .select({ count: count() })
        .from(matches)
        .where(and(...whereConditions)),
    ]);

    res.json({
      matches: matchesData,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limitNum),
      },
    });
  } catch (error) {
    console.error("Get turf matches error:", error);
    res.status(500).json({ error: "Failed to fetch turf matches" });
  }
});

// Get turf users
router.get("/users", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.turfId) {
      return res.status(403).json({ error: "Turf access required" });
    }

    const { page = "1", limit = "10", role: userRole, search } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const limitNum = parseInt(limit as string);

    let whereConditions = [eq(userRoles.turfId, req.user.turfId)];

    if (userRole) {
      whereConditions.push(sql`roles.name = ${userRole}`);
    }

    if (search) {
      whereConditions.push(
        sql`(${users.name} ILIKE ${"%" + search + "%"} OR ${users.email} ILIKE ${"%" + search + "%"})`,
      );
    }

    const [usersData, totalCount] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          status: users.status,
          isEmailVerified: users.isEmailVerified,
          isPhoneVerified: users.isPhoneVerified,
          role: sql<string>`roles.name`,
          createdAt: users.createdAt,
        })
        .from(userRoles)
        .innerJoin(users, eq(userRoles.userId, users.id))
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(...whereConditions))
        .orderBy(users.createdAt)
        .limit(limitNum)
        .offset(offset),

      db
        .select({ count: count() })
        .from(userRoles)
        .innerJoin(users, eq(userRoles.userId, users.id))
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(...whereConditions)),
    ]);

    res.json({
      users: usersData,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limitNum),
      },
    });
  } catch (error) {
    console.error("Get turf users error:", error);
    res.status(500).json({ error: "Failed to fetch turf users" });
  }
});

export default router;
