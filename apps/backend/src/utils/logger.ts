import winston from 'winston';
import { env } from '../config/env';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const envLevel = env.NODE_ENV?.toUpperCase() || 'DEVELOPMENT';
  const isDevelopment = envLevel === 'DEVELOPMENT';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create logs directory if it doesn't exist
import { existsSync, mkdirSync } from 'fs';
if (!existsSync('logs')) {
  mkdirSync('logs');
}

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url, ip } = req;
    const { statusCode } = res;
    
    logger.http(`${method} ${url} - ${statusCode} - ${duration}ms - ${ip}`);
  });
  
  next();
};

// Error logging middleware
export const errorLogger = (err: any, req: any, _res: any, next: any) => {
  logger.error(`${err.name}: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next(err);
};

// Database logging
export const dbLogger = {
  query: (sql: string, params?: any[]) => {
    logger.debug(`DB Query: ${sql}`, params ? { params } : {});
  },
  
  error: (error: any, operation: string) => {
    logger.error(`DB Error in ${operation}: ${error.message}`, {
      stack: error.stack,
      operation
    });
  },
  
  success: (operation: string, details?: any) => {
    logger.info(`DB Success: ${operation}`, details);
  }
};

// Authentication logging
export const authLogger = {
  login: (email: string, success: boolean, ip?: string) => {
    if (success) {
      logger.info(`Login successful: ${email}`, { ip });
    } else {
      logger.warn(`Login failed: ${email}`, { ip });
    }
  },
  
  register: (email: string, success: boolean, ip?: string) => {
    if (success) {
      logger.info(`Registration successful: ${email}`, { ip });
    } else {
      logger.warn(`Registration failed: ${email}`, { ip });
    }
  },
  
  tokenValidation: (success: boolean, reason?: string) => {
    if (success) {
      logger.debug('Token validation successful');
    } else {
      logger.warn(`Token validation failed: ${reason || 'Invalid token'}`);
    }
  }
};

// Match logging
export const matchLogger = {
  create: (matchId: string, turfId: string, teams: string) => {
    logger.info(`Match created: ${matchId}`, { 
      matchId, 
      turfId, 
      teams,
      timestamp: new Date().toISOString()
    });
  },
  
  start: (matchId: string, inningsId: string) => {
    logger.info(`Match started: ${matchId}`, { 
      matchId, 
      inningsId,
      timestamp: new Date().toISOString()
    });
  },
  
  ballRecorded: (matchId: string, ballData: any) => {
    logger.debug(`Ball recorded: ${matchId}`, { 
      matchId, 
      ballData,
      timestamp: new Date().toISOString()
    });
  },
  
  error: (matchId: string, operation: string, error: any) => {
    logger.error(`Match error in ${operation}: ${matchId}`, { 
      matchId, 
      operation,
      error: error.message,
      stack: error.stack
    });
  }
};

export default logger;
