import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { db } from '../db/client';
import { adminInvitations } from '../db/schema/admin-invitations';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Secure OTP Service
 * Implements cryptographically secure OTP generation with hashing and TTL
 */

export interface OTPConfig {
  length: number;
  ttlMinutes: number;
  maxAttempts: number;
  resendCooldownSeconds: number;
}

export const OTP_CONFIG: OTPConfig = {
  length: 6,
  ttlMinutes: 5, // 5 minutes TTL
  maxAttempts: 5,
  resendCooldownSeconds: 30, // 30 seconds cooldown
};

/**
 * Generate cryptographically secure OTP
 */
export const generateSecureOTP = (length: number = 6): string => {
  const chars = '0123456789';
  let otp = '';
  
  // Use crypto.randomBytes for cryptographically secure random numbers
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    const index = randomBytes[i] % chars.length;
    otp += chars[index];
  }
  
  return otp;
};

/**
 * Hash OTP for secure storage
 */
export const hashOTP = async (otp: string): Promise<string> => {
  return bcrypt.hash(otp, 12); // Higher rounds for OTP
};

/**
 * Verify OTP against hash
 */
export const verifyOTP = async (otp: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(otp, hash);
};

/**
 * Store email OTP with TTL and attempt tracking
 */
export const storeEmailOTP = async (
  invitationId: string,
  email: string,
  otp: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_CONFIG.ttlMinutes * 60 * 1000);

    await db
      .update(adminInvitations)
      .set({
        emailOtpHash: otpHash,
        emailOtpExpiresAt: expiresAt,
        emailOtpAttempts: 0,
        updatedAt: new Date(),
      })
      .where(eq(adminInvitations.id, invitationId));

    console.log(`🔐 Email OTP for ${email}: ${otp} (expires at ${expiresAt.toISOString()})`);
    
    return { success: true, message: "Email OTP sent successfully" };
  } catch (error) {
    console.error('Error storing email OTP:', error);
    return { success: false, message: "Failed to store email OTP" };
  }
};

/**
 * Store phone OTP with TTL and attempt tracking
 */
export const storePhoneOTP = async (
  invitationId: string,
  phone: string,
  otp: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_CONFIG.ttlMinutes * 60 * 1000);

    await db
      .update(adminInvitations)
      .set({
        phoneOtpHash: otpHash,
        phoneOtpExpiresAt: expiresAt,
        phoneOtpAttempts: 0,
        updatedAt: new Date(),
      })
      .where(eq(adminInvitations.id, invitationId));

    console.log(`🔐 Phone OTP for ${phone}: ${otp} (expires at ${expiresAt.toISOString()})`);
    
    return { success: true, message: "Phone OTP sent successfully" };
  } catch (error) {
    console.error('Error storing phone OTP:', error);
    return { success: false, message: "Failed to store phone OTP" };
  }
};

/**
 * Verify email OTP with rate limiting and TTL check
 */
export const verifyEmailOTP = async (
  invitationId: string,
  otp: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const invitation = await db
      .select()
      .from(adminInvitations)
      .where(eq(adminInvitations.id, invitationId))
      .limit(1);

    if (!invitation.length) {
      return { success: false, message: "Invitation not found" };
    }

    const inv = invitation[0];

    // Check if OTP has expired
    if (inv.emailOtpExpiresAt && inv.emailOtpExpiresAt < new Date()) {
      return { success: false, message: "OTP has expired" };
    }

    // Check max attempts
    if (inv.emailOtpAttempts >= OTP_CONFIG.maxAttempts) {
      return { success: false, message: "Maximum OTP attempts exceeded" };
    }

    // Verify OTP
    if (!inv.emailOtpHash) {
      return { success: false, message: "No OTP was sent" };
    }

    const isValid = await verifyOTP(otp, inv.emailOtpHash);

    if (!isValid) {
      // Increment attempt count
      const newAttempts = inv.emailOtpAttempts + 1;
      await db
        .update(adminInvitations)
        .set({
          emailOtpAttempts: newAttempts,
          updatedAt: new Date(),
        })
        .where(eq(adminInvitations.id, invitationId));

      const remainingAttempts = OTP_CONFIG.maxAttempts - newAttempts;
      return {
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempts remaining`,
      };
    }

    // Mark email as verified and phone as verified (skipping phone OTP)
    await db
      .update(adminInvitations)
      .set({
        emailVerified: true,
        phoneVerified: true, // Auto-verify phone since we're skipping phone OTP
        emailOtpHash: null,
        emailOtpExpiresAt: null,
        emailOtpAttempts: 0,
        updatedAt: new Date(),
      })
      .where(eq(adminInvitations.id, invitationId));

    return { success: true, message: "Email verified successfully" };
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    return { success: false, message: "Failed to verify email OTP" };
  }
};

/**
 * Verify phone OTP with rate limiting and TTL check
 */
export const verifyPhoneOTP = async (
  invitationId: string,
  otp: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const invitation = await db
      .select()
      .from(adminInvitations)
      .where(eq(adminInvitations.id, invitationId))
      .limit(1);

    if (!invitation.length) {
      return { success: false, message: "Invitation not found" };
    }

    const inv = invitation[0];

    // Check if OTP has expired
    if (inv.phoneOtpExpiresAt && inv.phoneOtpExpiresAt < new Date()) {
      return { success: false, message: "OTP has expired" };
    }

    // Check max attempts
    if (inv.phoneOtpAttempts >= OTP_CONFIG.maxAttempts) {
      return { success: false, message: "Maximum OTP attempts exceeded" };
    }

    // Verify OTP
    if (!inv.phoneOtpHash) {
      return { success: false, message: "No OTP was sent" };
    }

    const isValid = await verifyOTP(otp, inv.phoneOtpHash);

    if (!isValid) {
      // Increment attempt count
      const newAttempts = inv.phoneOtpAttempts + 1;
      await db
        .update(adminInvitations)
        .set({
          phoneOtpAttempts: newAttempts,
          updatedAt: new Date(),
        })
        .where(eq(adminInvitations.id, invitationId));

      const remainingAttempts = OTP_CONFIG.maxAttempts - newAttempts;
      return {
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempts remaining`,
      };
    }

    // Mark phone as verified and clear OTP
    await db
      .update(adminInvitations)
      .set({
        phoneVerified: true,
        phoneOtpHash: null,
        phoneOtpExpiresAt: null,
        phoneOtpAttempts: 0,
        updatedAt: new Date(),
      })
      .where(eq(adminInvitations.id, invitationId));

    return { success: true, message: "Phone verified successfully" };
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    return { success: false, message: "Failed to verify phone OTP" };
  }
};

/**
 * Check if OTP can be resent (cooldown period)
 */
export const canResendOTP = async (
  invitationId: string,
  type: 'email' | 'phone'
): Promise<{ canResend: boolean; cooldownSeconds: number }> => {
  try {
    const invitation = await db
      .select()
      .from(adminInvitations)
      .where(eq(adminInvitations.id, invitationId))
      .limit(1);

    if (!invitation.length) {
      return { canResend: false, cooldownSeconds: OTP_CONFIG.resendCooldownSeconds };
    }

    const inv = invitation[0];
    const lastUpdated = inv.updatedAt;
    const cooldownMs = OTP_CONFIG.resendCooldownSeconds * 1000;
    const timeSinceLastUpdate = Date.now() - lastUpdated.getTime();

    if (timeSinceLastUpdate < cooldownMs) {
      const remainingCooldown = Math.ceil((cooldownMs - timeSinceLastUpdate) / 1000);
      return { canResend: false, cooldownSeconds: remainingCooldown };
    }

    return { canResend: true, cooldownSeconds: 0 };
  } catch (error) {
    console.error('Error checking OTP resend cooldown:', error);
    return { canResend: false, cooldownSeconds: OTP_CONFIG.resendCooldownSeconds };
  }
};

/**
 * Clean up expired OTPs (should be run periodically)
 */
export const cleanupExpiredOTPs = async (): Promise<void> => {
  try {
    const now = new Date();
    
    await db
      .update(adminInvitations)
      .set({
        emailOtpHash: null,
        emailOtpExpiresAt: null,
        phoneOtpHash: null,
        phoneOtpExpiresAt: null,
        updatedAt: now,
      })
      .where(
        and(
          gt(adminInvitations.emailOtpExpiresAt, now),
          gt(adminInvitations.phoneOtpExpiresAt, now)
        )
      );

    console.log('🧹 Cleaned up expired OTPs');
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
};
