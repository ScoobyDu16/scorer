import { Request, Response, NextFunction } from 'express';
import { adminAuditLog } from '../db/schema/admin-invitations';
import { db } from '../db/client';
import { eq } from 'drizzle-orm';

/**
 * Extend Request interface to include custom properties
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      role?: string;
      turfId?: string;
    }
  }
}

/**
 * Rate Limiting Middleware
 * Implements rate limiting for API endpoints to prevent abuse
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    lastAttempt: number;
    requests?: number[];
    violations?: number;
    adaptiveMultiplier?: number;
  };
}

// In-memory store (in production, use Redis or database)
const rateLimitStore: RateLimitStore = {};

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message: string; // Error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

// Default rate limit configurations
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // OTP endpoints - very strict
  otp: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many OTP requests. Please try again later.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
    message: 'Too many authentication attempts. Please try again later.',
    skipSuccessfulRequests: true, // Don't count successful logins
    skipFailedRequests: false,
  },
  
  // General API endpoints
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'Too many requests. Please try again later.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  
  // Admin invitation endpoints
  adminInvitation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many invitation requests. Please try again later.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
};

/**
 * Get client identifier (IP address, user ID, or combination)
 */
function getClientIdentifier(req: Request): string {
  // Try to get user ID from authenticated request
  if (req.userId) {
    return `user:${req.userId}`;
  }
  
  // Fall back to IP address
  const ip = req.ip || 
    req.connection.remoteAddress || 
    req.socket?.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    'unknown';
  
  return `ip:${ip}`;
}

/**
 * Clean up expired entries from rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  }
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimit(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = getClientIdentifier(req);
    const now = Date.now();
    
    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      cleanupExpiredEntries();
    }
    
    // Get or create rate limit record
    let record = rateLimitStore[clientId];
    
    if (!record || record.resetTime < now) {
      // Create new record or reset expired one
      rateLimitStore[clientId] = {
        count: 0,
        resetTime: now + config.windowMs,
        lastAttempt: now,
      };
      record = rateLimitStore[clientId];
    }
    
    // Increment counter for this request
    record.count++;
    record.lastAttempt = now;
    
    // Check if limit exceeded
    if (record.count > config.maxRequests) {
      // Log rate limit violation
      logRateLimitViolation(req, clientId, config);
      
      res.status(429).json({
        error: 'Too Many Requests',
        message: config.message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': config.maxRequests,
      'X-RateLimit-Remaining': Math.max(0, config.maxRequests - record.count),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
    });
    
    next();
  };
}

/**
 * Predefined rate limiters
 */
export const rateLimitOTP = createRateLimit(RATE_LIMIT_CONFIGS.otp);
export const rateLimitAuth = createRateLimit(RATE_LIMIT_CONFIGS.auth);
export const rateLimitGeneral = createRateLimit(RATE_LIMIT_CONFIGS.general);
export const rateLimitAdminInvitation = createRateLimit(RATE_LIMIT_CONFIGS.adminInvitation);

/**
 * Log rate limit violations to audit trail
 */
async function logRateLimitViolation(req: Request, clientId: string, config: RateLimitConfig): Promise<void> {
  try {
    await db.insert(adminAuditLog).values({
      userId: req.userId || null,
      action: 'RATE_LIMIT_VIOLATION',
      resource: 'API',
      resourceId: clientId,
      metadata: JSON.stringify({
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        limit: config.maxRequests,
        windowMs: config.windowMs,
      }),
      ipAddress: req.ip || null,
      userAgent: req.get('User-Agent') || null,
      location: null, // Could be enhanced with geo IP lookup
      success: false,
      errorMessage: config.message,
    });
  } catch (error) {
    console.error('Failed to log rate limit violation:', error);
  }
}

/**
 * Advanced rate limiting with sliding window
 */
export function createSlidingWindowRateLimit(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = getClientIdentifier(req);
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get all requests for this client in the current window
    // In production, this would be stored in Redis or a database
    let record = rateLimitStore[clientId];
    
    if (!record) {
      record = {
        count: 0,
        resetTime: now + config.windowMs,
        lastAttempt: now,
        requests: [] as number[], // Timestamps of recent requests
      };
      rateLimitStore[clientId] = record;
    }
    
    // Initialize requests array if needed
    if (!record.requests) {
      record.requests = [];
    }
    
    // Remove old requests outside the window
    record.requests = record.requests?.filter((timestamp: number) => timestamp > windowStart) || [];
    
    // Add current request
    record.requests.push(now);
    record.lastAttempt = now;
    
    // Check if limit exceeded
    if (record.requests.length > config.maxRequests) {
      // Log rate limit violation
      logRateLimitViolation(req, clientId, config);
      
      res.status(429).json({
        error: 'Too Many Requests',
        message: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000),
      });
      return;
    }
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': config.maxRequests,
      'X-RateLimit-Remaining': Math.max(0, config.maxRequests - record.requests.length),
      'X-RateLimit-Reset': new Date(now + config.windowMs).toISOString(),
    });
    
    next();
  };
}

/**
 * Rate limiting based on user ID (for authenticated users)
 */
export function createUserRateLimit(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userId) {
      // If not authenticated, use IP-based rate limiting
      return createRateLimit(config)(req, res, next);
    }
    
    const userId = req.userId;
    const now = Date.now();
    
    // Get or create user-specific record
    let record = rateLimitStore[`user:${userId}`];
    
    if (!record || record.resetTime < now) {
      rateLimitStore[`user:${userId}`] = {
        count: 0,
        resetTime: now + config.windowMs,
        lastAttempt: now,
      };
      record = rateLimitStore[`user:${userId}`];
    }
    
    // Increment counter
    record.count++;
    record.lastAttempt = now;
    
    // Check if limit exceeded
    if (record.count > config.maxRequests) {
      // Log rate limit violation
      logRateLimitViolation(req, `user:${userId}`, config);
      
      res.status(429).json({
        error: 'Too Many Requests',
        message: config.message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': config.maxRequests,
      'X-RateLimit-Remaining': Math.max(0, config.maxRequests - record.count),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
    });
    
    next();
  };
}

/**
 * Adaptive rate limiting based on user behavior
 */
export function createAdaptiveRateLimit(baseConfig: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = getClientIdentifier(req);
    const now = Date.now();
    
    let record = rateLimitStore[`adaptive:${clientId}`];
    
    if (!record) {
      record = {
        count: 0,
        resetTime: now + baseConfig.windowMs,
        lastAttempt: now,
        violations: 0, // Track repeated violations
        adaptiveMultiplier: 1, // Reduce limit for repeat offenders
        requests: [], // Store request timestamps
      };
      rateLimitStore[`adaptive:${clientId}`] = record;
    }
    
    // Initialize missing properties if needed
    if (record.violations === undefined) record.violations = 0;
    if (record.adaptiveMultiplier === undefined) record.adaptiveMultiplier = 1;
    if (record.requests === undefined) record.requests = [];
    
    // Adaptive logic: increase multiplier for repeat offenders
    if (record.lastAttempt > now - baseConfig.windowMs && record.violations > 0) {
      record.adaptiveMultiplier = Math.min(4, 1 + record.violations * 0.5);
    } else {
      // Reset multiplier after good behavior
      record.adaptiveMultiplier = Math.max(1, (record.adaptiveMultiplier || 1) - 0.1);
    }
    
    const adaptedLimit = Math.floor(baseConfig.maxRequests / record.adaptiveMultiplier);
    
    record.count++;
    record.lastAttempt = now;
    
    if (record.count > adaptedLimit) {
      record.violations++;
      
      // Log rate limit violation
      logRateLimitViolation(req, `adaptive:${clientId}`, baseConfig);
      
      res.status(429).json({
        error: 'Too Many Requests',
        message: `${baseConfig.message} (Adaptive limit: ${adaptedLimit})`,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': baseConfig.maxRequests,
      'X-RateLimit-Remaining': Math.max(0, adaptedLimit - record.count),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
      'X-RateLimit-Adaptive': record.adaptiveMultiplier.toString(),
    });
    
    next();
  };
}
