import axios from 'axios';

export interface AdminInvitationStatus {
  id: string;
  email: string;
  phone: string;
  status: 'PENDING' | 'EMAIL_VERIFIED' | 'PHONE_VERIFIED' | 'PASSWORD_SET' | 'TOTP_SETUP' | 'COMPLETED';
  emailVerified: boolean;
  phoneVerified: boolean;
  passwordSet: boolean;
  totpEnabled: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface AdminInvitationStatusResponse {
  success: boolean;
  message: string;
  invitation: AdminInvitationStatus;
}

export interface AdminInvitationVerifyRequest {
  token: string;
  otp: string;
}

export interface AdminInvitationPasswordRequest {
  token: string;
  password: string;
}

export interface AdminInvitationCompleteRequest {
  token: string;
  name: string;
  password: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const adminInvitationAPI = {
  // Get invitation status
  getStatus: async (token: string): Promise<AdminInvitationStatusResponse> => {
    const response = await axios.get(`${API_BASE_URL}/admin-invitations/status?token=${token}`);
    return response.data;
  },

  // Send email OTP
  sendEmailOTP: async (token: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/admin-invitations/send-email-otp`, { token });
    return response.data;
  },

  // Verify email OTP
  verifyEmailOTP: async (data: AdminInvitationVerifyRequest): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/admin-invitations/verify-email-otp`, data);
    return response.data;
  },

  // Set password
  setPassword: async (data: AdminInvitationPasswordRequest): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/admin-invitations/set-password`, data);
    return response.data;
  },

  // Setup TOTP
  setupTOTP: async (token: string): Promise<{ success: boolean; message: string; qrCode?: string; secret?: string }> => {
    const response = await axios.post(`${API_BASE_URL}/admin-invitations/setup-totp`, { token });
    return response.data;
  },

  // Verify TOTP
  verifyTOTP: async (data: AdminInvitationVerifyRequest): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/admin-invitations/verify-totp`, data);
    return response.data;
  },

  // Complete registration
  complete: async (data: AdminInvitationCompleteRequest): Promise<{ success: boolean; message: string; user?: any; token?: string }> => {
    const response = await axios.post(`${API_BASE_URL}/admin-invitations/complete`, data);
    return response.data;
  },
};
