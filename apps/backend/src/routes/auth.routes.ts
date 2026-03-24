import { Router, Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Login endpoint
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const result = await AuthService.login(email, password);

    res.json({
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({
      error: error instanceof Error ? error.message : "Login failed",
    });
  }
});

// Refresh token endpoint
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Refresh token is required",
      });
    }

    const result = await AuthService.refreshToken(refreshToken);

    res.json({
      message: "Token refreshed successfully",
      ...result,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      error: error instanceof Error ? error.message : "Token refresh failed",
    });
  }
});

// Get current user info
router.get("/me", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    res.json({
      user: req.user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: "Failed to get user information",
    });
  }
});

// Change password
router.post("/change-password", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters long",
      });
    }

    await AuthService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Password change failed",
    });
  }
});

export default router;
