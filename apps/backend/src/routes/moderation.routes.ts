import { Router, Response } from "express";
import { db } from "../db";
import { users, turfs, userRoles, roles, matches } from "../db/schema";
import { eq, count, and, gte, lte, sql, desc } from "drizzle-orm";
import { AuthenticatedRequest, authenticateToken, requireSuperAdmin } from "../middleware/auth";

const router = Router();

// Apply authentication and permissions
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Get all users with pagination and filters
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      status,
      role,
      search,
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const limitNum = parseInt(limit as string);

    let whereConditions = [];
    
    if (status) {
      whereConditions.push(sql`status = ${status}`);
    }
    
    if (search) {
      whereConditions.push(
        sql`(${users.name} ILIKE ${'%' + search + '%'} OR ${users.email} ILIKE ${'%' + search + '%'})`
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
          role: roles.name,
          turfName: turfs.name,
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .leftJoin(turfs, eq(userRoles.turfId, turfs.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(users.createdAt)
        .limit(limitNum)
        .offset(offset),
      
      db.select({ count: count() })
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined),
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
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user details
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        status: users.status,
        isEmailVerified: users.isEmailVerified,
        isPhoneVerified: users.isPhoneVerified,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        role: roles.name,
        turfName: turfs.name,
        turfEmail: turfs.email,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .leftJoin(turfs, eq(userRoles.turfId, turfs.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's match history (simplified without createdBy field)
    const matchHistory = await db
      .select({
        id: matches.id,
        teamAName: matches.teamAName,
        teamBName: matches.teamBName,
        status: matches.status,
        createdAt: matches.createdAt,
        turfName: turfs.name,
      })
      .from(matches)
      .leftJoin(turfs, eq(matches.turfId, turfs.id))
      .orderBy(desc(matches.createdAt))
      .limit(10);

    res.json({
      user: user[0],
      matchHistory,
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
});

// Update user status
router.patch("/:id/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = Array.isArray(id) ? id[0] : id;

    if (!["ACTIVE", "SUSPENDED", "BANNED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updatedUser = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: `User status updated to ${status}`,
      user: updatedUser[0],
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({ error: "Failed to update user status" });
  }
});

// Assign role to user
router.post("/:id/roles", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { roleId, turfId } = req.body;
    const userId = Array.isArray(id) ? id[0] : id;

    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove existing roles
    await db.delete(userRoles).where(eq(userRoles.userId, userId));

    // Assign new role
    await db.insert(userRoles).values({
      userId,
      roleId,
      turfId: turfId || null,
    });

    res.json({
      message: "User role assigned successfully",
      userId,
      roleId,
      turfId,
    });
  } catch (error) {
    console.error("Assign role error:", error);
    res.status(500).json({ error: "Failed to assign role" });
  }
});

// Remove user role
router.delete("/:id/roles/:roleId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, roleId } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;
    const userRoleId = Array.isArray(roleId) ? roleId[0] : roleId;

    await db
      .delete(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, userRoleId)
      ));

    res.json({
      message: "User role removed successfully",
      userId,
      roleId: userRoleId,
    });
  } catch (error) {
    console.error("Remove role error:", error);
    res.status(500).json({ error: "Failed to remove role" });
  }
});

// Get user statistics
router.get("/stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = "30" } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

    const [
      totalUsers,
      activeUsers,
      newUsers,
      usersByStatus,
      usersByRole,
    ] = await Promise.all([
      // Total users
      db.select({ count: count() }).from(users),
      
      // Active users
      db.select({ count: count() })
        .from(users)
        .where(sql`status = 'ACTIVE'`),
      
      // New users in period
      db.select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, daysAgo)),
      
      // Users by status
      db.select({
        status: users.status,
        count: count(),
      })
        .from(users)
        .groupBy(users.status),
      
      // Users by role
      db.select({
        role: roles.name,
        count: count(),
      })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .groupBy(roles.name),
    ]);

    res.json({
      period: `${period} days`,
      statistics: {
        total: totalUsers[0].count,
        active: activeUsers[0].count,
        new: newUsers[0].count,
        byStatus: usersByStatus,
        byRole: usersByRole,
      },
    });
  } catch (error) {
    console.error("User statistics error:", error);
    res.status(500).json({ error: "Failed to fetch user statistics" });
  }
});

// Ban/Unban user
router.patch("/:id/ban", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { banned, reason } = req.body;
    const userId = Array.isArray(id) ? id[0] : id;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const updatedUser = await db
      .update(users)
      .set({ 
        status: banned ? sql`'BANNED'` : sql`'ACTIVE'`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
      user: updatedUser[0],
      reason,
    });
  } catch (error) {
    console.error("Ban/Unban user error:", error);
    res.status(500).json({ error: "Failed to update user ban status" });
  }
});

export default router;
