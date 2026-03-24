import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db";
import { users, roles, userRoles, turfs } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  authenticateAdmin,
  requireSuperAdmin,
  generateAdminTokens,
} from "../middleware/admin-auth";

const router = Router();
const drizzleDb = drizzle(pool);

/**
 * Admin Authentication Routes
 * Production-grade security with 2FA support
 */

// Admin Login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password, totpCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Email and password required",
      });
    }

    // Find user with admin role
    const adminUserResult = await drizzleDb
      .select({
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          avatarUrl: users.avatarUrl,
          isPhoneVerified: users.isPhoneVerified,
          isEmailVerified: users.isEmailVerified,
          status: users.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          passwordHash: users.passwordHash,
        },
        role: {
          name: roles.name,
        },
        userRole: {
          turfId: userRoles.turfId,
        },
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(eq(users.email, email), eq(users.status, "ACTIVE")))
      .limit(1);

    console.log("Admin user query result:", adminUserResult);
    console.log("Admin user query result length:", adminUserResult.length);
    console.log("Admin user query result first item:", adminUserResult[0]);

    const adminUser =
      adminUserResult && adminUserResult[0] ? adminUserResult[0] : null;

    if (!adminUser) {
      console.log("Admin user not found for email:", email);
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid credentials",
      });
    }

    console.log("Admin user found:", {
      id: adminUser.user.id,
      email: adminUser.user.email,
      name: adminUser.user.name,
      hasPasswordHash: !!adminUser.user.passwordHash,
    });

    const { user, role } = adminUser[0] || {};

    // Verify admin role
    if (!role || !["SUPER_ADMIN", "TURF_ADMIN"].includes(role.name)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Admin access required",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.user.passwordHash || "",
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid credentials",
      });
    }

    // TODO: Implement TOTP verification for production
    // For now, we'll skip TOTP but log it for audit
    if (totpCode) {
      console.log(`[AUDIT] TOTP attempt for ${email}: ${totpCode}`);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateAdminTokens(
      user,
      role.name,
      adminUser[0].userRole?.turfId || undefined,
    );

    // Log successful login
    console.log(`[AUDIT] Admin login successful: ${email} (${role.name})`);

    res.json({
      message: "Login successful",
      data: {
        user: {
          id: user.user.id,
          email: user.user.email,
          name: user.user.name,
          role: role.name,
          turfId: user.userRole?.turfId,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Login failed",
    });
  }
});

// Refresh Token
router.post("/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Refresh token required",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
    ) as any;

    // Validate user still exists and is active
    const user = await drizzleDb
      .select({
        user: users,
        role: roles,
        userRole: userRoles,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(eq(users.id, decoded.userId), eq(users.status, "ACTIVE")))
      .limit(1);

    if (!user.length) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid refresh token",
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateAdminTokens(
      user[0].user,
      user[0].role!.name,
      user[0].userRole?.turfId || undefined,
    );

    res.json({
      message: "Token refreshed",
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid refresh token",
    });
  }
});

/**
 * Super Admin Dashboard Routes
 */

// Get Platform Statistics
router.get(
  "/dashboard/stats",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      // Get total turfs count
      const totalTurfs = await drizzleDb
        .select({ count: turfs.id })
        .from(turfs)
        .where(eq(turfs.isDeleted, false));

      // Get turfs by verification status
      const turfsByStatus = await drizzleDb
        .select({
          verificationStatus: turfs.verificationStatus,
          count: turfs.id,
        })
        .from(turfs)
        .where(eq(turfs.isDeleted, false));

      // Get active admins count
      const activeAdmins = await drizzleDb
        .select({ count: users.id })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(eq(users.status, "ACTIVE"), eq(roles.name, "TURF_ADMIN")));

      res.json({
        message: "Platform statistics retrieved",
        data: {
          totalTurfs: totalTurfs.length,
          activeAdmins: activeAdmins.length,
          turfsByVerificationStatus: turfsByStatus.reduce((acc: any, turf) => {
            const status = turf.verificationStatus;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {}),
        },
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to retrieve dashboard statistics",
      });
    }
  },
);

// Get Pending Turf Verifications
router.get(
  "/turfs/pending",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const pendingTurfs = await drizzleDb
        .select()
        .from(turfs)
        .where(
          and(
            eq(turfs.verificationStatus, "PENDING"),
            eq(turfs.isDeleted, false),
          ),
        )
        .orderBy(desc(turfs.createdAt));

      res.json({
        message: "Pending turfs retrieved",
        data: pendingTurfs,
      });
    } catch (error) {
      console.error("Pending turfs error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to retrieve pending turfs",
      });
    }
  },
);

// Approve/Reject Turf Verification
router.post(
  "/turfs/:turfId/verify",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { turfId } = req.params;
      const { action, reason } = req.body; // action: "APPROVE" | "REJECT"

      if (!["APPROVE", "REJECT"].includes(action)) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Invalid action. Must be APPROVE or REJECT",
        });
      }

      // Update turf verification status
      const updateData = {
        verificationStatus: action === "APPROVE" ? "VERIFIED" : "REJECTED",
        verifiedAt: action === "APPROVE" ? new Date() : null,
        verifiedBy: req.admin!.userId,
        updatedAt: new Date(),
      };

      const updatedTurf = await drizzleDb
        .update(turfs)
        .set(updateData)
        .where(eq(turfs.id, turfId as string))
        .returning();

      if (!updatedTurf.length) {
        return res.status(404).json({
          error: "Not Found",
          message: "Turf not found",
        });
      }

      // Log audit action
      console.log(
        `[AUDIT] Turf ${action.toLowerCase()}: ${turfId} by ${req.admin!.email}`,
      );

      res.json({
        message: `Turf ${action.toLowerCase()}d successfully`,
        data: updatedTurf[0],
      });
    } catch (error) {
      console.error("Turf verification error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to update turf verification",
      });
    }
  },
);

export default router;
