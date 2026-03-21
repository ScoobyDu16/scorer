import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export class ResendEmailService {
  private static instance: ResendEmailService;
  private resend: Resend | null = null;
  private initialized = false;

  private constructor() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.initialized = true;
    }
  }

  public static getInstance(): ResendEmailService {
    if (!ResendEmailService.instance) {
      ResendEmailService.instance = new ResendEmailService();
    }
    return ResendEmailService.instance;
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.initialized || !this.resend) {
      console.warn('Resend email service not initialized - missing RESEND_API_KEY');
      return false;
    }

    try {
      const fromEmail = options.from || process.env.FROM_EMAIL || 'onboarding@resend.dev';
      
      const { data, error } = await this.resend.emails.send({
        from: fromEmail,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      if (error) {
        console.error('Failed to send email via Resend:', error);
        return false;
      }

      console.log('Email sent successfully via Resend:', data);
      return true;
    } catch (error) {
      console.error('Failed to send email via Resend:', error);
      return false;
    }
  }

  public async sendAdminInvitationEmail(email: string, invitationToken: string, expiryHours: number = 24): Promise<boolean> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const invitationUrl = `${frontendUrl}/register?token=${invitationToken}&type=admin`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Admin Invitation</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">You've Been Invited!</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            You have been invited to join as an administrator for the Scorer platform. 
            This invitation will expire in ${expiryHours} hours.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      font-weight: bold;
                      display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>Security Notice:</strong> This link is unique to you and should not be shared with anyone.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
        
        <div style="padding: 20px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #6c757d; font-size: 12px;">
            © 2024 Scorer Platform. All rights reserved.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Admin Invitation - Scorer Platform',
      html,
    });
  }

  public async sendSecurityAlertEmail(email: string, alertDetails: {
    type: string;
    description: string;
    ipAddress?: string;
    location?: string;
    timestamp: Date;
  }): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🚨 Security Alert</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Suspicious Activity Detected</h2>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>Alert Type:</strong> ${alertDetails.type}<br>
              <strong>Description:</strong> ${alertDetails.description}<br>
              <strong>Time:</strong> ${alertDetails.timestamp.toLocaleString()}<br>
              ${alertDetails.ipAddress ? `<strong>IP Address:</strong> ${alertDetails.ipAddress}<br>` : ''}
              ${alertDetails.location ? `<strong>Location:</strong> ${alertDetails.location}<br>` : ''}
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            If this was you, no action is needed. If you don't recognize this activity, 
            please secure your account immediately.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/security" 
               style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      font-weight: bold;
                      display: inline-block;">
              Review Security Settings
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #6c757d; font-size: 12px;">
            © 2024 Scorer Platform. All rights reserved.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `🚨 Security Alert: ${alertDetails.type}`,
      html,
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  public isInitialized(): boolean {
    return this.initialized;
  }
}
