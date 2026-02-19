import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { authLogger } from "../utils/logger";

/**
 * Extend Request type to include turfId
 */
export interface AuthRequest extends Request {
  turfId?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      authLogger.tokenValidation(false, "Authorization header missing");
      return res.status(401).json({ message: "Authorization header missing" });
    }

    // Format: Bearer token
    const token = authHeader.split(" ")[1];

    if (!token) {
      authLogger.tokenValidation(false, "Token missing from authorization header");
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      turfId: string;
    };

    req.turfId = decoded.turfId;
    authLogger.tokenValidation(true);
    next();
  } catch (error: any) {
    authLogger.tokenValidation(false, error.message || "Invalid or expired token");
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
