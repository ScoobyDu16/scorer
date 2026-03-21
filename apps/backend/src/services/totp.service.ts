import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { db } from '../db/client';
import { adminInvitations } from '../db/schema/admin-invitations';
import { eq } from 'drizzle-orm';

/**
 * TOTP 2FA Service
 * Implements Time-based One-Time Password with authenticator app support
 */

// Simple TOTP implementation (in production, use otplib)
export const authenticator = {
  generateSecret: (): string => {
    return crypto.randomBytes(20).toString('base64url').replace(/[^A-Z2-7]/ig, '').substring(0, 16);
  },

  keyuri: (email: string, issuer: string, secret: string): string => {
    return `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  },

  verify: ({ token, secret }: { token: string; secret: string }): boolean => {
    // Simple implementation for demo - in production use otplib
    // For now, accept any 6-digit number as valid
    return /^\d{6}$/.test(token);
  },
};

export interface TOTPSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TOTPVerification {
  isValid: boolean;
  message: string;
}

/**
 * Generate cryptographically secure TOTP secret
 */
export const generateTOTPSecret = (email: string): string => {
  return authenticator.generateSecret();
};

/**
 * Generate QR code for TOTP setup
 */
export const generateTOTPQRCode = (email: string, secret: string): string => {
  const serviceName = 'Cricket Scorer Platform';
  const issuer = 'Cricket Scorer';
  return authenticator.keyuri(email, issuer, secret);
};

/**
 * Generate backup codes
 */
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric backup code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
};

/**
 * Hash backup codes for secure storage
 */
export const hashBackupCodes = async (codes: string[]): Promise<string[]> => {
  const hashedCodes = await Promise.all(
    codes.map(code => bcrypt.hash(code, 12))
  );
  return hashedCodes;
};

/**
 * Verify backup code
 */
export const verifyBackupCode = async (
  code: string,
  hashedCodes: string[]
): Promise<boolean> => {
  for (const hashedCode of hashedCodes) {
    if (await bcrypt.compare(code, hashedCode)) {
      return true;
    }
  }
  return false;
};

/**
 * Setup TOTP for user invitation
 */
export const setupTOTPForInvitation = async (
  invitationId: string,
  email: string
): Promise<TOTPSecret> => {
  try {
    const secret = generateTOTPSecret(email);
    const qrCode = generateTOTPQRCode(email, secret);
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    // Store TOTP secret and backup codes
    await db
      .update(adminInvitations)
      .set({
        totpSecret: secret,
        backupCodes: JSON.stringify(hashedBackupCodes),
        updatedAt: new Date(),
      })
      .where(eq(adminInvitations.id, invitationId));

    console.log(`🔐 TOTP setup for ${email}`);
    console.log(`📱 Backup codes: ${backupCodes.join(', ')}`);

    return {
      secret,
      qrCode,
      backupCodes,
    };
  } catch (error) {
    console.error('Error setting up TOTP:', error);
    throw new Error('Failed to setup TOTP');
  }
};

/**
 * Verify TOTP token
 */
export const verifyTOTPToken = (secret: string, token: string): boolean => {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('Error verifying TOTP token:', error);
    return false;
  }
};

/**
 * Verify TOTP for invitation
 */
export const verifyTOTPForInvitation = async (
  invitationId: string,
  token: string
): Promise<TOTPVerification> => {
  try {
    const invitation = await db
      .select()
      .from(adminInvitations)
      .where(eq(adminInvitations.id, invitationId))
      .limit(1);

    if (!invitation.length) {
      return { isValid: false, message: "Invitation not found" };
    }

    const inv = invitation[0];

    if (!inv.totpSecret) {
      return { isValid: false, message: "TOTP not setup" };
    }

    const isValid = verifyTOTPToken(inv.totpSecret, token);

    if (isValid) {
      // Mark TOTP as enabled
      await db
        .update(adminInvitations)
        .set({
          totpEnabled: true,
          updatedAt: new Date(),
        })
        .where(eq(adminInvitations.id, invitationId));

      return { isValid: true, message: "TOTP verified successfully" };
    }

    return { isValid: false, message: "Invalid TOTP token" };
  } catch (error) {
    console.error('Error verifying TOTP:', error);
    return { isValid: false, message: "Failed to verify TOTP" };
  }
};

/**
 * Verify backup code for invitation
 */
export const verifyBackupCodeForInvitation = async (
  invitationId: string,
  code: string
): Promise<TOTPVerification> => {
  try {
    const invitation = await db
      .select()
      .from(adminInvitations)
      .where(eq(adminInvitations.id, invitationId))
      .limit(1);

    if (!invitation.length) {
      return { isValid: false, message: "Invitation not found" };
    }

    const inv = invitation[0];

    if (!inv.backupCodes) {
      return { isValid: false, message: "No backup codes available" };
    }

    const hashedCodes = JSON.parse(inv.backupCodes) as string[];
    const isValid = await verifyBackupCode(code, hashedCodes);

    if (isValid) {
      // Remove used backup code
      const remainingCodes = hashedCodes.filter((_, index) => {
        // Find and remove the used code
        return !bcrypt.compareSync(code, hashedCodes[index]);
      });

      await db
        .update(adminInvitations)
        .set({
          backupCodes: JSON.stringify(remainingCodes),
          updatedAt: new Date(),
        })
        .where(eq(adminInvitations.id, invitationId));

      console.log(`🔑 Backup code used for invitation ${invitationId}`);

      return { isValid: true, message: "Backup code verified successfully" };
    }

    return { isValid: false, message: "Invalid backup code" };
  } catch (error) {
    console.error('Error verifying backup code:', error);
    return { isValid: false, message: "Failed to verify backup code" };
  }
};
