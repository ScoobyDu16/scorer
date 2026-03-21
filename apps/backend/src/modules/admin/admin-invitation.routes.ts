import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  rateLimitOTP,
  rateLimitAdminInvitation,
} from "../../middleware/rate-limit.middleware";
import {
  createInvitation,
  getInvitation,
  sendInvitationEmailOTP,
  sendInvitationPhoneOTP,
  verifyInvitationEmailOTP,
  verifyInvitationPhoneOTP,
  setInvitationPassword,
  setupInvitationTOTP,
  verifyInvitationTOTP,
  verifyInvitationBackupCode,
  completeInvitationFlow,
  getMyInvitations,
  revokeInvitationById,
} from "./admin-invitation.controller";

const router = Router();

// Apply rate limiting to OTP-related endpoints
router.use("/send-email-otp", rateLimitOTP);
router.use("/send-phone-otp", rateLimitOTP);
router.use("/verify-email-otp", rateLimitOTP);
router.use("/verify-phone-otp", rateLimitOTP);

// Public routes (for invitation flow)
router.get("/status", getInvitation);
router.post("/send-email-otp", sendInvitationEmailOTP);
router.post("/send-phone-otp", sendInvitationPhoneOTP);
router.post("/verify-email-otp", verifyInvitationEmailOTP);
router.post("/verify-phone-otp", verifyInvitationPhoneOTP);
router.post("/set-password", setInvitationPassword);
router.post("/setup-totp", setupInvitationTOTP);
router.post("/verify-totp", verifyInvitationTOTP);
router.post("/verify-backup-code", verifyInvitationBackupCode);
router.post("/complete", completeInvitationFlow);

// Public admin invitation creation (for initial setup)
router.use("/create", rateLimitAdminInvitation);
router.post("/create", createInvitation);

// Protected routes (require super admin authentication)
router.use(authMiddleware);
router.get("/my-invitations", getMyInvitations);
router.delete("/:invitationId", revokeInvitationById);

export default router;
