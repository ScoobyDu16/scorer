import bcrypt from "bcrypt";
import { db } from "../db";
import { users, userRoles, roles } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { generateTokens, verifyRefreshToken } from "../middleware/auth";

export class AuthService {
  static async login(email: string, password: string) {
    try {
      // Find user with role
      const userWithRole = await db
        .select({
          user: users,
          role: roles.name,
          turfId: userRoles.turfId,
        })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(eq(users.email, email), eq(users.status, "ACTIVE")))
        .limit(1);

      if (userWithRole.length === 0) {
        throw new Error("Invalid credentials");
      }

      const result = userWithRole[0];
      if (!result) {
        throw new Error("Invalid credentials");
      }

      const { user, role, turfId } = result;

      if (!user || !user.passwordHash) {
        throw new Error("Invalid credentials");
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error("Invalid credentials");
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: role || "PLAYER",
          turfId: turfId || undefined,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        throw new Error("Invalid refresh token");
      }

      // Get user
      const userWithRole = await db
        .select({
          user: users,
          role: roles.name,
          turfId: userRoles.turfId,
        })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(eq(users.id, decoded.userId), eq(users.status, "ACTIVE")))
        .limit(1);

      if (userWithRole.length === 0) {
        throw new Error("User not found");
      }

      const result = userWithRole[0];
      if (!result) {
        throw new Error("User not found");
      }

      const { user, role, turfId } = result;

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: role || "PLAYER",
          turfId: turfId || undefined,
        },
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      console.error("Token refresh error:", error);
      throw error;
    }
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // Get user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error("User not found");
      }

      const currentUser = user[0];
      if (!currentUser) {
        throw new Error("User not found");
      }

      if (!currentUser.passwordHash) {
        throw new Error("Password not set for this user");
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      if (!isValidPassword) {
        throw new Error("Current password is incorrect");
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, userId));

      return { success: true };
    } catch (error) {
      console.error("Password change error:", error);
      throw error;
    }
  }
}
