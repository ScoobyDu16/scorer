import { Router } from "express";
import { registerTurf, loginTurf } from "./turf.controller";

const router = Router();

router.post("/register", registerTurf);
router.post("/login", loginTurf);

export default router;
