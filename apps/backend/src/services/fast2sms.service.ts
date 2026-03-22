import axios from 'axios';

export interface Fast2SMSConfig {
  apiKey: string;
  senderId: string;
}

export class Fast2SMSService {
  private static instance: Fast2SMSService;
  private apiKey: string;
  private senderId: string;
  private initialized = false;

  private constructor() {
    this.apiKey = process.env.FAST2SMS_API_KEY || '';
    this.senderId = process.env.FAST2SMS_SENDER_ID || 'FTLIND';
    
    if (this.apiKey) {
      this.initialized = true;
    }
  }

  public static getInstance(): Fast2SMSService {
    if (!Fast2SMSService.instance) {
      Fast2SMSService.instance = new Fast2SMSService();
    }
    return Fast2SMSService.instance;
  }

  public async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.initialized) {
      console.error('Fast2SMS service not initialized - missing or invalid API key');
      console.log('Please get a valid API key from Fast2SMS dashboard');
      return false;
    }

    try {
      const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
        authorization: this.apiKey,
        sender_id: this.senderId,
        message,
        numbers: to.replace(/[^\d]/g, ''), // Remove all non-digits
        route: 'v3',
        language: 'english'
      });

      if (response.data.return === true) {
        console.log('✅ SMS sent successfully via Fast2SMS');
        return true;
      } else {
        console.error('❌ Fast2SMS API Error:', response.data.message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Failed to send SMS via Fast2SMS:', error.response?.data?.message || error.message);
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const invitationUrl = `${frontendUrl}/register?token=${invitationToken}&type=admin`;
    
    const message = `You've been invited to join Scorer as an administrator. Visit: ${invitationUrl} to accept. This invitation expires in ${expiryHours} hours. Do not share this link.`;

    return this.sendSMS(phoneNumber, message);
  }

  public isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation for Indian numbers
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''));
  }

  public formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure it starts with + for international format
    if (!cleaned.startsWith('+') && cleaned.length === 10) {
      // Assume Indian number if 10 digits
      return `+91${cleaned}`;
    }
    
    return cleaned;
  }
}
