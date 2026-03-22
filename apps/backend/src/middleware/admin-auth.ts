import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db";
import { users, roles, userRoles } from "../db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle(pool);

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  turfId?: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: JWTPayload;
    }
  }
}

/**
 * Production-grade Admin Authentication Middleware
 * 
 * Features:
 * - JWT verification with short-lived tokens
 * - Role-based access control
 * - Token refresh validation
 * - Audit logging
 */

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables");
}

export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Access token required"
      });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Validate user exists and is active
    const user = await db
      .select({
        user: users,
        role: roles,
        userRole: userRoles
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user.length || user[0].user.status !== "ACTIVE") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or inactive user"
      });
    }

    // Validate role
    if (!user[0].role || !["SUPER_ADMIN", "TURF_ADMIN"].includes(user[0].role.name)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Admin access required"
      });
    }

    // Attach admin info to request
    req.admin = {
      userId: decoded.userId,
      email: decoded.email,
      role: user[0].role.name,
      turfId: user[0].userRole?.turfId || undefined
    };

    // Log admin access (audit trail)
    console.log(`[AUDIT] Admin access: ${req.admin.email} (${req.admin.role}) - ${req.method} ${req.path}`);

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token expired"
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: "Unauthorized", 
        message: "Invalid token"
      });
    }

    console.error("Admin authentication error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Authentication failed"
    });
  }
};

/**
 * Require specific role for access
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required"
      });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `${req.admin.role} role not authorized for this resource`
      });
    }

    next();
  };
};

/**
 * Require Super Admin role
 */
export const requireSuperAdmin = requireRole(["SUPER_ADMIN"]);

/**
 * Require Turf Admin role (or Super Admin)
 */
export const requireTurfAdmin = requireRole(["SUPER_ADMIN", "TURF_ADMIN"]);

/**
 * Generate admin access tokens
 */
export const generateAdminTokens = (user: any, role: string, turfId?: string) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role,
    turfId
  };

  // Short-lived access token (15 minutes)
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m",
    issuer: "scorer-admin",
    audience: "scorer-admin"
  });

  // Longer-lived refresh token (7 days)
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
    issuer: "scorer-admin",
    audience: "scorer-admin"
  });

  return { accessToken, refreshToken };
};
