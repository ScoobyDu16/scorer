import { Router } from "express";
import turfRoutes from "../modules/turf/turf.routes";
import playerRoutes from "../modules/player/player.routes";
import accessCodeRoutes from "../modules/access-code/access-code.routes";
import matchRoutes from "../modules/match/match.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import inningRoutes from "../modules/innings/inning.routes";

const router = Router();

router.use("/turfs", turfRoutes);
router.use("/players", playerRoutes);
router.use("/access-codes", accessCodeRoutes);
router.use("/matches", matchRoutes);
router.use("/innings", inningRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
