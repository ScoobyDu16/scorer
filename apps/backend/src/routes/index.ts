import { Router } from "express";
import turfRoutes from "../modules/turf/turf.routes";
import playerRoutes from "../modules/player/player.routes";

const router = Router();

router.use("/turfs", turfRoutes);
router.use("/players", playerRoutes);

export default router;
