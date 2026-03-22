import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from '../db/client';
import { adminInvitations, adminAuditLog } from '../db/schema/admin-invitations';
import { users } from '../db/schema/users';
import { userRoles } from '../db/schema/user-roles';
import { roles } from '../db/schema/roles';
import { eq, and, gt } from 'drizzle-orm';
import { env } from '../config/env';
import { generateSecureOTP, storeEmailOTP, storePhoneOTP } from './otp.service';
import { setupTOTPForInvitation } from './totp.service';
import { EmailService } from './email.service';
import { SMSService } from './sms.service';
import { Fast2SMSService } from './fast2sms.service';
import { SecurityService } from './security.service';

/**
 * Admin Invitation Service
 * Handles secure invitation flow for super admin registration
 */

export interface InvitationRequest {
  email: string;
  phone: string;
  invitedBy: string; // User ID of the inviting super admin
}

export interface InvitationResponse {
  success: boolean;
  message: string;
  invitationId?: string;
  inviteLink?: string;
}

export interface InvitationStatus {
  success: boolean;
  message: string;
  invitation?: {
    id: string;
    email: string;
    phone: string;
    status: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    passwordSet: boolean;
    totpEnabled: boolean;
    expiresAt: Date;
  };
}

/**
 * Generate secure invitation token
 */
export const generateInviteToken = (invitationId: string): string => {
  const payload = {
    invitationId,
    type: 'admin_invitation',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };

  return jwt.sign(payload, env.JWT_SECRET);
};

/**
 * Verify invitation token
 */
export const verifyInviteToken = (token: string): { valid: boolean; invitationId?: string; error?: string } => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    
    if (decoded.type !== 'admin_invitation') {
      return { valid: false, error: 'Invalid token type' };
    }

    return { valid: true, invitationId: decoded.invitationId };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Invitation link has expired' };
    }
    return { valid: false, error: 'Invalid invitation token' };
  }
};

/**
 * Create admin invitation
 */
export const createAdminInvitation = async (data: InvitationRequest, requestContext?: { ip: string; userAgent: string }): Promise<InvitationResponse> => {
  try {
    const emailService = EmailService.getInstance();
    const smsService = process.env.FAST2SMS_API_KEY ? Fast2SMSService.getInstance() : SMSService.getInstance();
    const securityService = SecurityService.getInstance();

    // Check if invitation already exists for this email or phone
    const existingInvitation = await db
      .select()
      .from(adminInvitations)
      .where(
        and(
          eq(adminInvitations.email, data.email),
          eq(adminInvitations.status, 'PENDING')
        )
      )
      .limit(1);

    if (existingInvitation.length) {
      return {
        success: false,
        message: 'Invitation already sent to this email',
      };
    }

    // Generate invitation token
    const invitationId = crypto.randomUUID();
    const inviteToken = generateInviteToken(invitationId);
    const inviteTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation record
    await db.insert(adminInvitations).values({
      id: invitationId,
      email: data.email,
      phone: data.phone,
      invitedBy: data.invitedBy,
      inviteToken,
      inviteTokenExpiresAt,
      expiresAt: invitationExpiresAt,
      status: 'PENDING',
    });

    // Log the invitation creation
    await logAdminAction(data.invitedBy, 'INVITATION_SENT', 'INVITATION', invitationId, {
      email: data.email,
      phone: data.phone,
      ipAddress: requestContext?.ip,
      userAgent: requestContext?.userAgent,
    });

    // Generate invite link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const inviteLink = `${frontendUrl}/register?token=${inviteToken}&type=admin`;

    console.log(`📧 Admin invitation created for ${data.email}`);
    console.log(`🔗 Invite link: ${inviteLink}`);

    // Send invitation email
    const emailSent = await emailService.sendAdminInvitationEmail(data.email, inviteToken);
    if (!emailSent) {
      console.warn(`Failed to send invitation email to ${data.email}`);
    }

    // Send invitation SMS
    const formattedPhone = smsService.formatPhoneNumber(data.phone);
    const smsSent = await smsService.sendInvitationSMS(formattedPhone, inviteToken);
    if (!smsSent) {
      console.warn(`Failed to send invitation SMS to ${formattedPhone}`);
    }

    return {
      success: true,
      message: 'Invitation sent successfully',
      invitationId,
      inviteLink,
    };
  } catch (error) {
    console.error('Error creating admin invitation:', error);
    return {
      success: false,
      message: 'Failed to create invitation',
    };
  }
};

/**
 * Get invitation status
 */
export const getInvitationStatus = async (token: string): Promise<InvitationStatus> => {
  try {
    const tokenVerification = verifyInviteToken(token);
    
    if (!tokenVerification.valid) {
      return {
        success: false,
        message: tokenVerification.error || 'Invalid invitation token',
      };
    }

    const invitation = await db
      .select()
      .from(adminInvitations)
      .where(eq(adminInvitations.id, tokenVerification.invitationId!))
      .limit(1);

    if (!invitation.length) {
      return {
        success: false,
        message: 'Invitation not found',
      };
    }

    const inv = invitation[0];

    // Check if invitation has expired
    if (inv.expiresAt < new Date()) {
      return {
        success: false,
        message: 'Invitation has expired',
      };
    }

    return {
      success: true,
      message: 'Invitation found',
      invitation: {
        id: inv.id,
        email: inv.email,
        phone: inv.phone,
        status: inv.status,
        emailVerified: inv.emailVerified,
        phoneVerified: inv.phoneVerified,
        passwordSet: inv.passwordSet,
        totpEnabled: inv.totpEnabled,
        expiresAt: inv.expiresAt,
      },
    };
  } catch (error) {
    console.error('Error getting invitation status:', error);
    return {
      success: false,
      message: 'Failed to get invitation status',
    };
  }
};

/**
 * Send email OTP for invitation
 */
export const sendEmailOTPForInvitation = async (token: string): Promise<{ success: boolean; message: string }> => {
  try {
    const emailService = EmailService.getInstance();
    const tokenVerification = verifyInviteToken(token);
    
    if (!tokenVerification.valid) {
      return { success: false, message: tokenVerification.error || 'Invalid invitation token' };
    }

    const invitation = await db
      .select()
      .from(adminInvitations)
      .where(eq(adminInvitations.id, tokenVerification.invitationId!))
      .limit(1);

    if (!invitation.length) {
      return { success: false, message: 'Invitation not found' };
    }

    const inv = invitation[0];

    if (inv.emailVerified) {
      return { success: false, message: 'Email already verified' };
    }

    // Generate and store OTP
    const otp = generateSecureOTP();
    await storeEmailOTP(inv.id, inv.email, otp);

    console.log(`📧 Email OTP for ${inv.email}: ${otp}`);

    // Send email with OTP
    const emailSent = await emailService.sendEmail({
      to: inv.email,
      subject: 'Email Verification - Scorer Admin Invitation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Email Verification</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Your verification code is:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #fff; border: 2px solid #667eea; padding: 20px; border-radius: 8px; display: inline-block;">
                <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${otp}</span>
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This code will expire in 10 minutes. If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    if (!emailSent) {
      console.warn(`Failed to send email OTP to ${inv.email}`);
    }

    return { success: true, message: 'Email OTP sent successfully' };
  } catch (error) {
    console.error('Error sending email OTP:', error);
    return { success: false, message: 'Failed to send email OTP' };
  }
};

/**
 * Send phone OTP for invitation
 */
export const sendPhoneOTPForInvitation = async (token: string): Promise<{ success: boolean; message: string }> => {
  try {
    const smsService = process.env.FAST2SMS_API_KEY ? Fast2SMSService.getInstance() : SMSService.getInstance();
    const tokenVerification = verifyInviteToken(token);
    
    if (!tokenVerification.valid) {
      return { success: false, message: tokenVerification.error || 'Invalid invitation token' };
    }

    const invitation = await db
      .select()
      .from(adminInvitations)
      .where(eq(adminInvitations.id, tokenVerification.invitationId!))
      .limit(1);

    if (!invitation.length) {
      return { success: false, message: 'Invitation not found' };
    }

    const inv = invitation[0];

    if (inv.phoneVerified) {
      return { success: false, message: 'Phone already verified' };
    }

    // Generate and store OTP
    const otp = generateSecureOTP();
    await storePhoneOTP(inv.id, inv.phone, otp);

    console.log(`📱 Phone OTP for ${inv.phone}: ${otp}`);

    // Send SMS with OTP
    const formattedPhone = smsService.formatPhoneNumber(inv.phone);
    const smsSent = await smsService.sendOTP(formattedPhone, otp);
    
    if (!smsSent) {
      console.warn(`Failed to send phone OTP to ${formattedPhone}`);
    }

    return { success: true, message: 'Phone OTP sent successfully' };
  } catch (error) {
    console.error('Error sending phone OTP:', error);
    return { success: false, message: 'Failed to send phone OTP' };
  }
};

/**
 * Set password for invitation
 */
export const setPasswordForInvitation = async (
  token: string,
  password: string
): Promise<{ success: boolean; message: string; passwordHash?: string }> => {
  try {
    const tokenVerification = verifyInviteToken(token);
    
    if (!tokenVerification.valid) {
      return { success: false, message: tokenVerification.error || 'Invalid invitation token' };
    }

    const invitation = await db
      .select()
      .from(adminInvitations)
      .where(eq(adminInvitations.id, tokenVerification.invitationId!))
      .limit(1);

    if (!invitation.length) {
      return { success: false, message: 'Invitation not found' };
    }

    const inv = invitation[0];

    if (inv.passwordSet) {
      return { success: false, message: 'Password already set' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update invitation
    await db
      .update(adminInvitations)
      .set({
        passwordSet: true,
        updatedAt: new Date(),
      })
      .where(eq(adminInvitations.id, inv.id));

    console.log(`🔒 Password set for invitation ${inv.id}`);

    return { success: true, message: 'Password set successfully', passwordHash };
  } catch (error) {
    console.error('Error setting password:', error);
    return { success: false, message: 'Failed to set password' };
  }
};

/**
 * Setup TOTP for invitation
 */
export const setupTOTPForInvitationFlow = async (
  token: string
): Promise<{ success: boolean; message: string; totpData?: any }> => {
  try {
    const tokenVerification = verifyInviteToken(token);
    
    if (!tokenVerification.valid) {
      return { success: false, message: tokenVerification.error || 'Invalid invitation token' };
    }

    const invitation = await db
      .select()
      .from(adminInvitations)
      .where(eq(adminInvitations.id, tokenVerification.invitationId!))
      .limit(1);

    if (!invitation.length) {
      return { success: false, message: 'Invitation not found' };
    }

    const inv = invitation[0];

    if (!inv.emailVerified || !inv.phoneVerified || !inv.passwordSet) {
      return { success: false, message: 'Please complete email verification, phone verification, and password setup first' };
    }

    if (inv.totpEnabled) {
      return { success: false, message: 'TOTP already enabled' };
    }

    // Setup TOTP
    const totpData = await setupTOTPForInvitation(inv.id, inv.email);

    return {
      success: true,
      message: 'TOTP setup initiated',
      totpData,
    };
  } catch (error) {
    console.error('Error setting up TOTP:', error);
    return { success: false, message: 'Failed to setup TOTP' };
  }
};

/**
 * Complete invitation and create user account
 */
export const completeInvitation = async (token: string, password: string): Promise<{ success: boolean; message: string; user?: any }> => {
  try {
    const tokenVerification = verifyInviteToken(token);
    
    if (!tokenVerification.valid) {
      return { success: false, message: tokenVerification.error || 'Invalid invitation token' };
    }

    const invitation = await db
      .select()
      .from(adminInvitations)
      .where(eq(adminInvitations.id, tokenVerification.invitationId!))
      .limit(1);

    if (!invitation.length) {
      return { success: false, message: 'Invitation not found' };
    }

    const inv = invitation[0];

    // Check all requirements are met
    if (!inv.emailVerified || !inv.phoneVerified || !inv.passwordSet || !inv.totpEnabled) {
      return { success: false, message: 'Please complete all verification steps before creating account' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user account
    const newUser = await db.insert(users).values({
      name: 'Super Admin', // Will be updated later
      email: inv.email,
      phone: inv.phone,
      passwordHash,
      isEmailVerified: true,
      isPhoneVerified: true,
      status: 'ACTIVE',
    }).returning();

    // Get SUPER_ADMIN role ID
    const roleRecord = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, 'SUPER_ADMIN'))
      .limit(1);

    if (!roleRecord.length) {
      return { success: false, message: 'Super Admin role not found' };
    }

    // Assign role to user
    await db.insert(userRoles).values({
      userId: newUser[0].id,
      roleId: roleRecord[0].id,
    });

    // Update invitation status
    await db
      .update(adminInvitations)
      .set({
        status: 'ACTIVE',
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(adminInvitations.id, inv.id));

    // Log account creation
    await logAdminAction(newUser[0].id, 'USER_CREATED', 'USER', newUser[0].id, {
      invitationId: inv.id,
      email: inv.email,
      phone: inv.phone,
    });

    console.log(`🎉 Super admin account created: ${newUser[0].id}`);

    return {
      success: true,
      message: 'Account created successfully',
      user: newUser[0],
    };
  } catch (error) {
    console.error('Error completing invitation:', error);
    return { success: false, message: 'Failed to create account' };
  }
};

/**
 * Log admin action for audit trail
 */
export const logAdminAction = async (
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  metadata?: any
): Promise<void> => {
  try {
    await db.insert(adminAuditLog).values({
      userId,
      action,
      resource,
      resourceId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress: null, // Will be set from request context
      userAgent: null, // Will be set from request context
      location: null, // Will be set from request context
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

/**
 * Get all invitations for a super admin
 */
export const getInvitationsByInviter = async (inviterId: string): Promise<any[]> => {
  try {
    const invitations = await db
      .select({
        id: adminInvitations.id,
        email: adminInvitations.email,
        phone: adminInvitations.phone,
        status: adminInvitations.status,
        emailVerified: adminInvitations.emailVerified,
        phoneVerified: adminInvitations.phoneVerified,
        passwordSet: adminInvitations.passwordSet,
        totpEnabled: adminInvitations.totpEnabled,
        createdAt: adminInvitations.createdAt,
        expiresAt: adminInvitations.expiresAt,
        acceptedAt: adminInvitations.acceptedAt,
      })
      .from(adminInvitations)
      .where(eq(adminInvitations.invitedBy, inviterId))
      .orderBy(adminInvitations.createdAt);

    return invitations;
  } catch (error) {
    console.error('Error getting invitations:', error);
    return [];
  }
};

/**
 * Revoke invitation
 */
export const revokeInvitation = async (
  invitationId: string,
  revokedBy: string
): Promise<{ success: boolean; message: string }> => {
  try {
    await db
      .update(adminInvitations)
      .set({
        status: 'REVOKED',
        updatedAt: new Date(),
      })
      .where(eq(adminInvitations.id, invitationId));

    await logAdminAction(revokedBy, 'INVITATION_REVOKED', 'INVITATION', invitationId);

    return { success: true, message: 'Invitation revoked successfully' };
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return { success: false, message: 'Failed to revoke invitation' };
  }
};
