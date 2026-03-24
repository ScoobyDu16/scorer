import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users, userRoles, roles } from "../db/schema";
import { eq, and } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    turfId?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-change-in-production";

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
};

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Get user with role information
    const userWithRole = await db
      .select({
        user: users,
        role: roles.name,
        turfId: userRoles.turfId,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (userWithRole.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { user, role, turfId } = userWithRole[0];
    
    if (!user || user.status !== "ACTIVE") {
      return res.status(403).json({ error: "User account is not active" });
    }

    req.user = {
      id: user.id,
      email: user.email || "",
      name: user.name,
      role: role || "PLAYER",
      turfId: turfId || undefined,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

export const requireSuperAdmin = requireRole(["SUPER_ADMIN"]);
export const requireTurfAdmin = requireRole(["SUPER_ADMIN", "TURF_ADMIN"]);
export const requireScorer = requireRole(["SUPER_ADMIN", "TURF_ADMIN", "SCORER"]);
export const requirePlayer = requireRole(["SUPER_ADMIN", "TURF_ADMIN", "SCORER", "PLAYER"]);
