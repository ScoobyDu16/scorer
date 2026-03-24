import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { userRoles, roles, rolePermissions, permissions } from "../db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { AuthenticatedRequest } from "./auth";

export interface PermissionCheck {
  permission: string;
  turfId?: string;
}

export const hasPermission = async (userId: string, permissionName: string, turfId?: string): Promise<boolean> => {
  try {
    // Get user's roles and their permissions
    const userPermissions = await db
      .select({
        permissionName: permissions.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          turfId ? eq(userRoles.turfId, turfId) : isNull(userRoles.turfId)
        )
      );

    // Check if user has the required permission
    return userPermissions.some(p => p.permissionName === permissionName);
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
};

export const requirePermission = (permissionName: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: "Authentication required",
          code: "AUTH_REQUIRED"
        });
      }

      // SUPER_ADMIN has all permissions
      if (req.user.role === "SUPER_ADMIN") {
        return next();
      }

      // Check specific permission
      const hasRequiredPermission = await hasPermission(
        req.user.id, 
        permissionName, 
        req.user.turfId
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({ 
          error: "Insufficient permissions",
          code: "INSUFFICIENT_PERMISSIONS",
          required: permissionName,
          userRole: req.user.role,
          turfId: req.user.turfId
        });
      }

      next();
    } catch (error) {
      console.error("Permission middleware error:", error);
      return res.status(500).json({ 
        error: "Permission check failed",
        code: "PERMISSION_CHECK_ERROR"
      });
    }
  };
};

// Predefined permission middleware
export const requireManagePlatform = requirePermission("MANAGE_PLATFORM");
export const requireManageTurfs = requirePermission("MANAGE_TURFS");
export const requireManageSubscriptions = requirePermission("MANAGE_SUBSCRIPTIONS");
export const requireViewAnalytics = requirePermission("VIEW_ANALYTICS");
export const requireModerateUsers = requirePermission("MODERATE_USERS");
export const requireManageOwnTurf = requirePermission("MANAGE_OWN_TURF");
export const requireManagePlayers = requirePermission("MANAGE_PLAYERS");
export const requireManageMatches = requirePermission("MANAGE_MATCHES");
export const requireManageScorers = requirePermission("MANAGE_SCORERS");
export const requireViewTurfAnalytics = requirePermission("VIEW_TURF_ANALYTICS");
export const requireScoreMatch = requirePermission("SCORE_MATCH");
export const requireViewMatchDetails = requirePermission("VIEW_MATCH_DETAILS");
export const requireManageInnings = requirePermission("MANAGE_INNINGS");
export const requireRecordBalls = requirePermission("RECORD_BALLS");
export const requireRecordWickets = requirePermission("RECORD_WICKETS");
export const requireRecordExtras = requirePermission("RECORD_EXTRAS");
export const requireUndoBall = requirePermission("UNDO_BALL");
export const requireViewScorecards = requirePermission("VIEW_SCORECARDS");
export const requireViewStats = requirePermission("VIEW_STATS");
export const requireFollowPlayers = requirePermission("FOLLOW_PLAYERS");
export const requireShareScorecards = requirePermission("SHARE_SCORECARDS");

// Helper function to get all permissions for a user
export const getUserPermissions = async (userId: string, turfId?: string) => {
  try {
    const userPermissions = await db
      .select({
        permissionName: permissions.name,
        permissionDescription: permissions.name, // We don't have description in current schema
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          turfId ? eq(userRoles.turfId, turfId) : isNull(userRoles.turfId)
        )
      );

    return userPermissions;
  } catch (error) {
    console.error("Get user permissions error:", error);
    return [];
  }
};

// Middleware to check if user can access a specific turf
export const requireTurfAccess = (turfIdParam: string = "turfId") => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: "Authentication required",
          code: "AUTH_REQUIRED"
        });
      }

      // SUPER_ADMIN can access any turf
      if (req.user.role === "SUPER_ADMIN") {
        return next();
      }

      const turfId = req.params[turfIdParam] || req.body[turfIdParam] || req.query[turfIdParam];

      if (!turfId) {
        return res.status(400).json({ 
          error: "Turf ID is required",
          code: "TURF_ID_REQUIRED"
        });
      }

      // Check if user has access to this turf
      const userRole = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userId, req.user.id),
            eq(userRoles.turfId, turfId as string)
          )
        )
        .limit(1);

      if (userRole.length === 0) {
        return res.status(403).json({ 
          error: "Access denied to this turf",
          code: "TURF_ACCESS_DENIED",
          turfId
        });
      }

      next();
    } catch (error) {
      console.error("Turf access check error:", error);
      return res.status(500).json({ 
        error: "Turf access check failed",
        code: "TURF_ACCESS_ERROR"
      });
    }
  };
};
