import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../services/security.service';

export const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const securityService = SecurityService.getInstance();
  const analysis = securityService.analyzeRequest(req);

  // Check IP allowlist (only for admin routes, but exclude create endpoint)
  if ((req.path.startsWith('/admin/') || req.path.startsWith('/api/admin/')) && !req.path.includes('/create')) {
    if (!analysis.isAllowed) {
      await securityService.createSecurityAlert({
        type: 'unauthorized_ip',
        description: `Access attempt from disallowed IP: ${analysis.ip}`,
        ipAddress: analysis.ip,
        userAgent: analysis.userAgent,
        severity: 'high',
        timestamp: new Date(),
      });

      return res.status(403).json({
        error: 'Access denied from this IP address',
        code: 'UNAUTHORIZED_IP',
      });
    }
  }

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Rate limiting based on risk score
  if (analysis.riskScore > 50) {
    await securityService.createSecurityAlert({
      type: 'suspicious_login',
      description: `High risk request detected (Score: ${analysis.riskScore}): ${analysis.concerns.join(', ')}`,
      ipAddress: analysis.ip,
      userAgent: analysis.userAgent,
      severity: analysis.riskScore > 70 ? 'critical' : 'medium',
      timestamp: new Date(),
    });

    return res.status(429).json({
      error: 'Request blocked due to security concerns',
      code: 'HIGH_RISK_REQUEST',
    });
  }

  // Add security analysis to request for downstream use
  req.securityAnalysis = analysis;

  next();
};

// Extend Request interface to include security analysis
declare global {
  namespace Express {
    interface Request {
      securityAnalysis?: {
        ip: string;
        userAgent: string;
        isAllowed: boolean;
        riskScore: number;
        concerns: string[];
      };
    }
  }
}

export const deviceTrackingMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const securityService = SecurityService.getInstance();
  
  // Generate device fingerprint
  const fingerprint = securityService.generateDeviceFingerprint(req);
  
  // Extract device info from headers
  const deviceInfo = {
    userAgent: req.headers['user-agent'] || '',
    ip: securityService.getClientIP(req),
    screenResolution: req.headers['x-screen-resolution'] as string,
    timezone: req.headers['x-timezone'] as string,
    language: req.headers['accept-language'] as string,
    platform: req.headers['x-platform'] as string,
    cookieEnabled: req.headers['x-cookie-enabled'] === 'true',
    dnt: req.headers['dnt'] as string | undefined,
  };

  // Check if it's a known device
  const isKnownDevice = securityService.isKnownDevice(fingerprint, deviceInfo);

  // If it's a new device accessing admin routes, create an alert (but exclude create endpoint)
  if (!isKnownDevice && (req.path.startsWith('/admin/') || req.path.startsWith('/api/admin/')) && !req.path.includes('/create')) {
    const location = await securityService.getLocationFromIP(deviceInfo.ip);
    
    await securityService.createSecurityAlert({
      type: 'new_device',
      description: `New device accessing admin resources from ${deviceInfo.ip}`,
      ipAddress: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
      location: location || undefined,
      severity: 'medium',
      timestamp: new Date(),
    });

    // Add device to trusted devices after successful authentication
    req.newDeviceFingerprint = fingerprint;
  }

  req.deviceFingerprint = fingerprint;
  req.deviceInfo = deviceInfo;

  next();
};

// Extend Request interface for device tracking
declare global {
  namespace Express {
    interface Request {
      deviceFingerprint?: string;
      deviceInfo?: any;
      newDeviceFingerprint?: string;
    }
  }
}
