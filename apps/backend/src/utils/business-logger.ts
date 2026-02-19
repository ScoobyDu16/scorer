import logger from './logger';

// Business operation logger with clean, structured format
export class BusinessLogger {
  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  // Log successful operations
  success(operation: string, details?: any) {
    logger.info(`[${this.module}] - ${operation}`, details);
  }

  // Log process start
  start(operation: string, details?: any) {
    logger.info(`[${this.module}] - Starting ${operation}`, details);
  }

  // Log fetching operations
  fetching(entity: string, identifier: string, details?: any) {
    logger.info(`[${this.module}] - Fetching ${entity} for ${identifier}`, details);
  }

  // Log found results
  found(entity: string, data: any, details?: any) {
    logger.info(`[${this.module}] - Found ${entity}`, { data, ...details });
  }

  // Log creation operations
  created(entity: string, identifier: string, details?: any) {
    logger.info(`[${this.module}] - Created ${entity} with ID ${identifier}`, details);
  }

  // Log update operations
  updated(entity: string, identifier: string, details?: any) {
    logger.info(`[${this.module}] - Updated ${entity} with ID ${identifier}`, details);
  }

  // Log deletion operations
  deleted(entity: string, identifier: string, details?: any) {
    logger.info(`[${this.module}] - Deleted ${entity} with ID ${identifier}`, details);
  }

  // Log validation errors
  validation(field: string, value: any, rule: string) {
    logger.warn(`[${this.module}] - Validation failed: ${field}=${value} (${rule})`);
  }

  // Log business logic errors
  error(operation: string, error: any, details?: any) {
    logger.error(`[${this.module}] - Error in ${operation}: ${error.message}`, {
      operation,
      stack: error.stack,
      ...details
    });
  }

  // Log authorization events
  authorized(action: string, entity: string, identifier: string, details?: any) {
    logger.info(`[${this.module}] - Authorized ${action} on ${entity} ${identifier}`, details);
  }

  // Log unauthorized attempts
  unauthorized(action: string, entity: string, reason: string, details?: any) {
    logger.warn(`[${this.module}] - Unauthorized ${action} on ${entity}: ${reason}`, details);
  }
}

// Create module-specific loggers
export const matchLogger = new BusinessLogger('Match Controller');
export const turfLogger = new BusinessLogger('Turf Controller');
export const playerLogger = new BusinessLogger('Player Controller');
export const accessCodeLogger = new BusinessLogger('Access Code Controller');
export const authServiceLogger = new BusinessLogger('Auth Service');
export const matchServiceLogger = new BusinessLogger('Match Service');
export const ballServiceLogger = new BusinessLogger('Ball Service');
