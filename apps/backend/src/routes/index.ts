import { Router } from "express";
import turfRoutes from "../modules/turf/turf.routes";
import playerRoutes from "../modules/player/player.routes";
import accessCodeRoutes from "../modules/access-code/access-code.routes";
import matchRoutes from "../modules/match/match.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import dashboardV2Routes from "../modules/dashboard/dashboard-v2.routes";
import inningRoutes from "../modules/innings/inning.routes";
import leaderboardRoutes from "../modules/leaderboard/leaderboard.routes";
import authRoutes from "../modules/auth/auth.routes";
import adminInvitationRoutes from "../modules/admin/admin-invitation.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin-invitations", adminInvitationRoutes);
router.use("/turfs", turfRoutes);
router.use("/players", playerRoutes);
router.use("/access-codes", accessCodeRoutes);
router.use("/matches", matchRoutes);
router.use("/innings", inningRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/dashboard-v2", dashboardV2Routes);
router.use("/leaderboard", leaderboardRoutes);

export default router;
