import { Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  createAdminInvitation,
  getInvitationStatus,
  sendEmailOTPForInvitation,
  sendPhoneOTPForInvitation,
  setPasswordForInvitation,
  setupTOTPForInvitationFlow,
  completeInvitation,
  getInvitationsByInviter,
  revokeInvitation,
} from "../../services/invitation.service";
import { verifyEmailOTP, verifyPhoneOTP } from "../../services/otp.service";
import { verifyTOTPForInvitation, verifyBackupCodeForInvitation } from "../../services/totp.service";
import { env } from "../../config/env";

/**
 * Admin Invitation Controller
 * Handles secure invitation flow for super admin registration
 */

export const createInvitation = async (req: any, res: Response) => {
  try {
    // For development/testing, allow without authentication
    // In production, you might want to add a special admin key or other security
    const { email, phone, invitedBy } = req.body;

    if (!email || !phone) {
      return res.status(400).json({ message: "Email and phone are required" });
    }

    const requestContext = {
      ip: req.securityAnalysis?.ip || req.ip || 'unknown',
      userAgent: req.securityAnalysis?.userAgent || req.headers['user-agent'] || '',
    };

    const result = await createAdminInvitation({
      email,
      phone,
      invitedBy: invitedBy || 'system',
    }, requestContext);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: "Invitation token is required" });
    }

    const result = await getInvitationStatus(token);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendInvitationEmailOTP = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Invitation token is required" });
    }

    const result = await sendEmailOTPForInvitation(token);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendInvitationPhoneOTP = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Invitation token is required" });
    }

    const result = await sendPhoneOTPForInvitation(token);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyInvitationEmailOTP = async (req: AuthRequest, res: Response) => {
  try {
    const { token, otp } = req.body;

    if (!token || !otp) {
      return res.status(400).json({ message: "Token and OTP are required" });
    }

    // Get invitation ID from token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as any;
    } catch (error) {
      return res.status(400).json({ message: "Invalid or expired invitation token" });
    }

    const result = await verifyEmailOTP(decoded.invitationId, otp);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyInvitationPhoneOTP = async (req: AuthRequest, res: Response) => {
  try {
    const { token, otp } = req.body;

    if (!token || !otp) {
      return res.status(400).json({ message: "Token and OTP are required" });
    }

    // Get invitation ID from token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as any;
    } catch (error) {
      return res.status(400).json({ message: "Invalid or expired invitation token" });
    }

    const result = await verifyPhoneOTP(decoded.invitationId, otp);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const setInvitationPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const result = await setPasswordForInvitation(token, password);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const setupInvitationTOTP = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Invitation token is required" });
    }

    const result = await setupTOTPForInvitationFlow(token);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyInvitationTOTP = async (req: AuthRequest, res: Response) => {
  try {
    const { token, code } = req.body;

    if (!token || !code) {
      return res.status(400).json({ message: "Token and TOTP code are required" });
    }

    // Get invitation ID from token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as any;
    } catch (error) {
      return res.status(400).json({ message: "Invalid or expired invitation token" });
    }

    const result = await verifyTOTPForInvitation(decoded.invitationId, code);

    if (result.isValid) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyInvitationBackupCode = async (req: AuthRequest, res: Response) => {
  try {
    const { token, code } = req.body;

    if (!token || !code) {
      return res.status(400).json({ message: "Token and backup code are required" });
    }

    // Get invitation ID from token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as any;
    } catch (error) {
      return res.status(400).json({ message: "Invalid or expired invitation token" });
    }

    const result = await verifyBackupCodeForInvitation(decoded.invitationId, code);

    if (result.isValid) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const completeInvitationFlow = async (req: AuthRequest, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    const result = await completeInvitation(token, password);

    if (result.success) {
      // Generate JWT token for the new user
      const tokenPayload = {
        userId: result.user.id,
        turfId: undefined,
        role: 'SUPER_ADMIN',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      };

      const jwtToken = jwt.sign(tokenPayload, env.JWT_SECRET);

      res.json({
        success: true,
        message: "Account created successfully",
        token: jwtToken,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          role: 'SUPER_ADMIN',
        },
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyInvitations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const invitations = await getInvitationsByInviter(req.userId);

    res.json({
      success: true,
      invitations,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const revokeInvitationById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { invitationId } = req.params;

    if (!invitationId) {
      return res.status(400).json({ message: "Invitation ID is required" });
    }

    const result = await revokeInvitation(invitationId, req.userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
