import { Request, Response, NextFunction } from "express";
import { AuthRequest, UserRole } from "./auth.middleware";

/**
 * Middleware to check if user has required role
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.role) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        required: allowedRoles,
        current: req.role
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is Super Admin
 */
export const requireSuperAdmin = requireRole(["SUPER_ADMIN"]);

/**
 * Middleware to check if user is Turf Admin or higher
 */
export const requireTurfAdmin = requireRole(["SUPER_ADMIN", "TURF_ADMIN"]);

/**
 * Middleware to check if user is Scorer or higher
 */
export const requireScorer = requireRole(["SUPER_ADMIN", "TURF_ADMIN", "SCORER"]);

/**
 * Middleware to check if user has any valid role (authenticated users only)
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.role) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

/**
 * Middleware to check if user can access specific turf
 * Super Admin can access any turf
 * Others can only access their assigned turf
 */
export const requireTurfAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.role) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Super Admin can access any turf
  if (req.role === "SUPER_ADMIN") {
    return next();
  }

  // Others must have turfId
  if (!req.turfId) {
    return res.status(403).json({ message: "Turf access required" });
  }

  next();
};
