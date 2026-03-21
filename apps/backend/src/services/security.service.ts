import { Request } from 'express';
import { EmailService } from './email.service';
import { SMSService } from './sms.service';

export interface SecurityAlert {
  userId?: string;
  type: 'suspicious_login' | 'unauthorized_ip' | 'new_device' | 'brute_force' | 'unusual_location';
  description: string;
  ipAddress: string;
  userAgent?: string;
  location?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface DeviceFingerprint {
  userAgent: string;
  ip: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  cookieEnabled?: boolean;
  dnt?: string;
  plugins?: string;
  canvas?: string;
  webgl?: string;
}

export class SecurityService {
  private static instance: SecurityService;
  private emailService = EmailService.getInstance();
  private smsService = SMSService.getInstance();
  private allowedIPs: Set<string> = new Set();
  private trustedDevices: Map<string, DeviceFingerprint> = new Map();
  private failedAttempts: Map<string, number> = new Map();

  private constructor() {
    this.loadAllowedIPs();
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  private loadAllowedIPs(): void {
    const allowedIPsEnv = process.env.ALLOWED_ADMIN_IPS;
    if (allowedIPsEnv) {
      const ips = allowedIPsEnv.split(',').map(ip => ip.trim());
      ips.forEach(ip => this.allowedIPs.add(ip));
    }

    // Add localhost for development
    if (process.env.NODE_ENV !== 'production') {
      this.allowedIPs.add('127.0.0.1');
      this.allowedIPs.add('::1');
      this.allowedIPs.add('localhost');
    }
  }

  public isIPAllowed(ip: string): boolean {
    if (this.allowedIPs.size === 0) {
      // If no IPs are configured, allow all (for development)
      return true;
    }

    // Check exact match
    if (this.allowedIPs.has(ip)) {
      return true;
    }

    // Check CIDR ranges
    for (const allowedIP of this.allowedIPs) {
      if (this.isIPInCIDR(ip, allowedIP)) {
        return true;
      }
    }

    return false;
  }

  private isIPInCIDR(ip: string, cidr: string): boolean {
    const [network, prefixLength] = cidr.split('/');
    if (!prefixLength) return false;

    // Simple IPv4 CIDR check (can be enhanced for IPv6)
    const ipParts = ip.split('.').map(Number);
    const networkParts = network.split('.').map(Number);
    const prefix = parseInt(prefixLength);

    if (ipParts.length !== 4 || networkParts.length !== 4) {
      return false;
    }

    const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
    const ipInt = (ipParts[0] << 24 | ipParts[1] << 16 | ipParts[2] << 8 | ipParts[3]) >>> 0;
    const networkInt = (networkParts[0] << 24 | networkParts[1] << 16 | networkParts[2] << 8 | networkParts[3]) >>> 0;

    return (ipInt & mask) === (networkInt & mask);
  }

  public generateDeviceFingerprint(req: Request): string {
    const userAgent = req.headers['user-agent'] || '';
    const ip = this.getClientIP(req);
    
    // Create a basic fingerprint
    const fingerprint = Buffer.from(`${userAgent}|${ip}`).toString('base64');
    return fingerprint.replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  public isKnownDevice(fingerprint: string, deviceInfo: Partial<DeviceFingerprint>): boolean {
    const knownDevice = this.trustedDevices.get(fingerprint);
    if (!knownDevice) {
      return false;
    }

    // Check if device characteristics have changed significantly
    const userAgentChanged = deviceInfo.userAgent && deviceInfo.userAgent !== knownDevice.userAgent;
    const ipChanged = deviceInfo.ip && deviceInfo.ip !== knownDevice.ip;

    // If both changed, it might be a different device
    if (userAgentChanged && ipChanged) {
      return false;
    }

    return true;
  }

  public addTrustedDevice(fingerprint: string, deviceInfo: DeviceFingerprint): void {
    this.trustedDevices.set(fingerprint, deviceInfo);
  }

  public recordFailedAttempt(identifier: string): void {
    const current = this.failedAttempts.get(identifier) || 0;
    this.failedAttempts.set(identifier, current + 1);

    // Clear after 1 hour
    setTimeout(() => {
      this.failedAttempts.delete(identifier);
    }, 60 * 60 * 1000);
  }

  public hasTooManyFailedAttempts(identifier: string, maxAttempts: number = 5): boolean {
    return (this.failedAttempts.get(identifier) || 0) >= maxAttempts;
  }

  public clearFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  public async createSecurityAlert(alert: SecurityAlert): Promise<void> {
    console.log(`🚨 Security Alert [${alert.severity.toUpperCase()}]: ${alert.type} - ${alert.description}`);

    // In production, you would store this in the database
    // For now, we'll just send notifications

    // Send email notification if configured
    if (process.env.SECURITY_ALERT_EMAIL) {
      await this.emailService.sendSecurityAlertEmail(
        process.env.SECURITY_ALERT_EMAIL,
        {
          type: alert.type,
          description: alert.description,
          ipAddress: alert.ipAddress,
          location: alert.location,
          timestamp: alert.timestamp,
        }
      );
    }

    // Send SMS notification if critical
    if (alert.severity === 'critical' && process.env.SECURITY_ALERT_PHONE) {
      await this.smsService.sendSecurityAlertSMS(
        process.env.SECURITY_ALERT_PHONE,
        {
          type: alert.type,
          description: alert.description,
          timestamp: alert.timestamp,
        }
      );
    }
  }

  public getClientIP(req: Request): string {
    return req.ip || 
           req.headers['x-forwarded-for'] as string || 
           req.headers['x-real-ip'] as string || 
           req.connection.remoteAddress || 
           'unknown';
  }

  public async getLocationFromIP(ip: string): Promise<string | null> {
    try {
      // You can integrate with a geolocation service like MaxMind, ipapi.co, etc.
      // For now, return a placeholder
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      if (response.ok) {
        const data = await response.json();
        return `${data.city}, ${data.country}`;
      }
    } catch (error) {
      console.error('Failed to get location from IP:', error);
    }
    return null;
  }

  public analyzeRequest(req: Request): {
    ip: string;
    userAgent: string;
    isAllowed: boolean;
    riskScore: number;
    concerns: string[];
  } {
    const ip = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const isAllowed = this.isIPAllowed(ip);
    
    const concerns: string[] = [];
    let riskScore = 0;

    if (!isAllowed) {
      concerns.push('IP not in allowlist');
      riskScore += 40;
    }

    if (!userAgent || userAgent.length < 10) {
      concerns.push('Suspicious user agent');
      riskScore += 20;
    }

    if (userAgent.includes('bot') || userAgent.includes('crawler')) {
      concerns.push('Bot detected');
      riskScore += 30;
    }

    return {
      ip,
      userAgent,
      isAllowed,
      riskScore,
      concerns,
    };
  }
}
