import { Twilio } from 'twilio';

export interface SMSServiceConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export class SMSService {
  private static instance: SMSService;
  private client: Twilio | null = null;
  private initialized = false;

  private constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (accountSid && authToken && fromNumber) {
      this.client = new Twilio(accountSid, authToken);
      this.initialized = true;
    }
  }

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  public async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.initialized || !this.client) {
      console.warn('SMS service not initialized - missing Twilio credentials');
      return false;
    }

    try {
      await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_FROM_NUMBER,
        to,
      });
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  public async sendOTP(phoneNumber: string, otp: string, expiryMinutes: number = 10): Promise<boolean> {
    const message = `Your Scorer admin verification code is: ${otp}. This code will expire in ${expiryMinutes} minutes. Do not share this code with anyone.`;

    return this.sendSMS(phoneNumber, message);
  }

  public async sendSecurityAlertSMS(phoneNumber: string, alertDetails: {
    type: string;
    description: string;
    timestamp: Date;
  }): Promise<boolean> {
    const message = `🚨 Security Alert: ${alertDetails.type}. ${alertDetails.description}. Time: ${alertDetails.timestamp.toLocaleString()}. If this wasn't you, please secure your account immediately.`;

    return this.sendSMS(phoneNumber, message);
  }

  public async sendInvitationSMS(phoneNumber: string, invitationToken: string, expiryHours: number = 24): Promise<boolean> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const invitationUrl = `${frontendUrl}/admin/register?token=${invitationToken}`;
    
    const message = `You've been invited to join Scorer as an administrator. Visit: ${invitationUrl} to accept. This invitation expires in ${expiryHours} hours. Do not share this link.`;

    return this.sendSMS(phoneNumber, message);
  }

  public isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation - can be enhanced with libphonenumber
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''));
  }

  public formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure it starts with + for international format
    if (!cleaned.startsWith('+') && cleaned.length === 10) {
      // Assume US number if 10 digits
      return `+1${cleaned}`;
    }
    
    return cleaned;
  }
}
