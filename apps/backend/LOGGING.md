# Backend Logging System

This document outlines the comprehensive logging system implemented for the Cricket Scorer backend.

## Logging Library
- **Winston** - Professional logging library with multiple transports and levels

## Log Levels
- **error** (0) - Critical errors, system failures
- **warn** (1) - Warning messages, potential issues
- **info** (2) - General information, successful operations
- **http** (3) - HTTP requests/responses
- **debug** (4) - Detailed debugging information

## Log Outputs

### Console Output (Development)
- Colored output based on log level
- Format: `YYYY-MM-DD HH:mm:ss:ms LEVEL: message`
- All levels shown in development mode

### File Output (Production)
- **logs/error.log** - Error level logs only
- **logs/combined.log** - All logs in JSON format
- Structured data with timestamps and metadata

## Logging Categories

### 1. Request Logging (`requestLogger`)
**Middleware**: Logs all HTTP requests
**Data Captured**:
- HTTP method, URL, status code
- Response duration
- Client IP address
- User-Agent

**Example**:
```
2024-02-19 14:30:15:123 http: POST /api/matches - 201 - 45ms - 192.168.1.100
```

### 2. Error Logging (`errorLogger`)
**Middleware**: Logs all application errors
**Data Captured**:
- Error name and message
- Stack trace
- Request URL and method
- Client IP and User-Agent

**Example**:
```json
{
  "level": "error",
  "message": "ValidationError: Invalid match data",
  "timestamp": "2024-02-19T14:30:15.123Z",
  "stack": "Error: Invalid match data\n    at ...",
  "url": "/api/matches",
  "method": "POST",
  "ip": "192.168.1.100"
}
```

### 3. Database Logging (`dbLogger`)
**Purpose**: Track all database operations
**Methods**:
- `query()` - SQL queries with parameters
- `error()` - Database operation failures
- `success()` - Successful database operations

**Examples**:
```javascript
dbLogger.query("SELECT * FROM matches WHERE id = $1", [matchId]);
dbLogger.success("Match created", { matchId: "123", teams: "Team A vs Team B" });
dbLogger.error(error, "Insert ball data");
```

### 4. Authentication Logging (`authLogger`)
**Purpose**: Track all authentication events
**Methods**:
- `login(email, success, ip)` - Login attempts
- `register(email, success, ip)` - Registration attempts  
- `tokenValidation(success, reason)` - JWT validation

**Examples**:
```javascript
authLogger.login("user@example.com", true, "192.168.1.100");  // Success
authLogger.login("user@example.com", false, "192.168.1.100"); // Failed
authLogger.tokenValidation(false, "Expired token");
```

### 5. Match Logging (`matchLogger`)
**Purpose**: Track cricket match operations
**Methods**:
- `create(matchId, turfId, teams)` - Match creation
- `start(matchId, inningsId)` - Match start
- `ballRecorded(matchId, ballData)` - Ball recording
- `error(matchId, operation, error)` - Match errors

**Examples**:
```javascript
matchLogger.create("123", "456", "Team A vs Team B");
matchLogger.start("123", "789");
matchLogger.ballRecorded("123", { runs: 4, over: 15, ball: 3 });
```

## Environment Configuration

### Development Mode
- Log level: `debug` (shows everything)
- Console output with colors
- File logging enabled

### Production Mode  
- Log level: `warn` (errors and warnings only)
- No console colors
- File logging only

## Security Considerations

1. **Sensitive Data**: Never log passwords, tokens, or PII
2. **IP Tracking**: Log IP addresses for security monitoring
3. **Failed Attempts**: Track failed authentication for abuse detection
4. **Database Queries**: Log queries for debugging but sanitize parameters

## Log Rotation

Logs are written to files without built-in rotation. Consider implementing:
- Log rotation based on file size
- Compression of old logs
- Automated cleanup of old log files

## Monitoring

### Key Metrics to Monitor
- Error rate and patterns
- Failed authentication attempts
- Database query performance
- API response times
- Unusual request patterns

### Alert Triggers
- High error rates (>5% of requests)
- Multiple failed logins from same IP
- Database connection failures
- Slow response times (>2 seconds)

## Usage in Code

```typescript
import logger, { authLogger, matchLogger, dbLogger } from '../utils/logger';

// General logging
logger.info('Application started');
logger.error('Critical error occurred');

// Specific category logging
authLogger.login(email, success, ip);
matchLogger.create(matchId, turfId, teams);
dbLogger.query(sql, params);
```

## Best Practices

1. **Log at appropriate levels** - Use correct severity
2. **Include context** - Add relevant metadata
3. **Avoid over-logging** - Don't log every trivial operation
4. **Structured data** - Use objects for complex information
5. **Security first** - Never log sensitive information
