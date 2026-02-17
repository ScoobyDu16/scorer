import { Router } from "express";
import turfRoutes from "../modules/turf/turf.routes";

const router = Router();

router.use("/turfs", turfRoutes);

export default router;
