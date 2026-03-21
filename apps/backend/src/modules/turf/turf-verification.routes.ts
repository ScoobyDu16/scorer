import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireSuperAdmin } from "../../middleware/role.middleware";
import {
  getPendingVerifications,
  getAllTurfsForVerification,
  processTurfVerification,
  getTurfVerificationDetails,
  updateTurfStatus,
} from "./turf-verification.controller";

const router = Router();

// All routes require super admin role
router.use(authMiddleware);
router.use(requireSuperAdmin);

// Get pending verifications
router.get("/pending", getPendingVerifications);

// Get all turfs with filters
router.get("/", getAllTurfsForVerification);

// Process verification (approve/reject/request info)
router.post("/:turfId/verify", processTurfVerification);

// Get turf verification details
router.get("/:turfId", getTurfVerificationDetails);

// Update turf status (suspend/reactivate)
router.put("/:turfId/status", updateTurfStatus);

export default router;
