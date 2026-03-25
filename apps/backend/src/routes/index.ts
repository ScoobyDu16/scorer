import { Router } from "express";
import playerRoutes from "../modules/player/player.routes";
import accessCodeRoutes from "../modules/access-code/access-code.routes";
import matchRoutes from "../modules/match/match.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import inningRoutes from "../modules/innings/inning.routes";
import leaderboardRoutes from "../modules/leaderboard/leaderboard.routes";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin-routes";
import analyticsRoutes from "./analytics.routes";
import moderationRoutes from "./moderation.routes";
import turfAdminRoutes from "./turf-admin.routes";
import turfRegistrationRoutes from "./turf-registration.routes";
import scoringLockRoutes from "./scoring-lock.routes";

const router = Router();

// Public routes
router.use("/auth", authRoutes);
router.use("/turf-registration", turfRegistrationRoutes);

// Protected routes
router.use("/admin", adminRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/moderation", moderationRoutes);
router.use("/turf-admin", turfAdminRoutes);
router.use("/scoring-locks", scoringLockRoutes);
router.use("/players", playerRoutes);
router.use("/access-codes", accessCodeRoutes);
router.use("/matches", matchRoutes);
router.use("/innings", inningRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/leaderboard", leaderboardRoutes);

export default router;
