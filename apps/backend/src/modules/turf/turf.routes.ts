import { Router } from "express";
import { registerTurf, loginTurf } from "./turf.controller";
import { authMiddleware, AuthRequest } from "../../middleware/auth.middleware";
import turfVerificationRoutes from "./turf-verification.routes";

const router = Router();

router.post("/register", registerTurf);
router.post("/login", loginTurf);

// Turf verification routes (super admin only)
router.use("/verification", turfVerificationRoutes);

// Protected test route
router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  res.json({
    message: "Authenticated",
    turfId: req.turfId,
  });
});

export default router;
