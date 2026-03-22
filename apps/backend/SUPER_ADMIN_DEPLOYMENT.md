# Super Admin Deployment Guide

## Overview

This guide covers the production deployment of the Super Admin functionality for the Scorer cricket platform with production-grade security.

## Architecture Implemented

### Role Hierarchy
```
SUPER_ADMIN → Platform scope
TURF_ADMIN → Turf scope  
SCORER → Match operations
PLAYER → Consumer
```

### Database Schema
- **users**: Core user authentication with phone/email verification
- **roles**: SUPER_ADMIN, TURF_ADMIN, SCORER, PLAYER
- **user_roles**: Role assignments with turf scoping
- **permissions**: Granular permissions (MANAGE_PLATFORM, VERIFY_TURF, etc.)
- **role_permissions**: Role-permission mapping
- **turfs**: Enhanced with verification status and subscription fields
- **subscriptions**: SaaS subscription management
- **matches**: Scoring lock system (activeScorerId, scorerSessionId, lockExpiresAt)

## Security Features

### Authentication
- **JWT tokens**: Short-lived (15min) access + long-lived (7d) refresh
- **Password hashing**: bcrypt with 12 rounds
- **Role-based access control**: Middleware enforcement
- **Audit logging**: All admin actions logged

### Admin Routes
- `POST /api/admin/auth/login` - Secure login
- `POST /api/admin/auth/refresh` - Token refresh
- `GET /api/admin/dashboard/stats` - Platform statistics (SUPER_ADMIN only)
- `GET /api/admin/turfs/pending` - Pending turf verifications
- `POST /api/admin/turfs/:turfId/verify` - Approve/reject turfs

## Production Deployment Steps

### 1. Environment Setup

```bash
# Copy production template
cp .env.production .env

# Update with production values
nano .env
```

**Critical variables to update:**
- `DATABASE_URL` - Production PostgreSQL connection
- `JWT_SECRET` - 32+ character random string
- `JWT_REFRESH_SECRET` - Different 32+ character random string
- `SUPER_ADMIN_EMAIL` - Admin email
- `SUPER_ADMIN_PASSWORD` - Strong password
- `FRONTEND_URL` - Production frontend URL

### 2. Database Migration

```bash
# Run migrations
pnpm drizzle:migrate

# Create super admin (run once)
pnpm ts-node src/db/seed-super-admin.ts
```

### 3. Security Configuration

#### Domain Setup
- Main app: `yourapp.com`
- Admin panel: `admin.yourapp.com`

#### SSL/TLS
- Enable HTTPS on both domains
- Configure proper SSL certificates

#### Firewall Rules
- Restrict database access
- Limit admin panel access if needed

### 4. Production Security Enhancements

#### Rate Limiting
```javascript
// Add to app.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests
  message: 'Too many requests'
});

app.use('/api/admin', limiter);
```

#### IP Whitelisting (Optional)
```javascript
// Add to admin-auth.ts
const ALLOWED_IPS = ['YOUR_OFFICE_IP'];

export const authenticateAdmin = (req, res, next) => {
  const clientIP = req.ip;
  if (!ALLOWED_IPS.includes(clientIP)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  // ... rest of auth logic
};
```

#### 2FA Implementation (Future)
```javascript
// Add to login endpoint
import speakeasy from 'speakeasy';

// In login route
if (!user.totpSecret) {
  // Require 2FA setup
  return res.json({ requires2FASetup: true });
}

if (!speakeasy.totp.verify({
  secret: user.totpSecret,
  encoding: 'base32',
  token: totpCode
})) {
  return res.status(401).json({ error: 'Invalid 2FA code' });
}
```

### 5. Monitoring & Logging

#### Audit Trail
All admin actions are automatically logged:
```javascript
console.log(`[AUDIT] ${action}: ${userId} - ${req.method} ${req.path}`);
```

#### Error Monitoring
- Set up Sentry or similar for error tracking
- Monitor failed login attempts
- Alert on suspicious activity

### 6. Backup Strategy

#### Database Backups
```bash
# Daily backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Automated backup script
0 2 * * * /path/to/backup-script.sh
```

#### Configuration Backups
- Version control all configuration
- Document all environment variables
- Store secrets in secure vault

## Testing Production Deployment

### 1. Admin Login Test
```bash
curl -X POST https://admin.yourapp.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourapp.com","password":"YourSecurePassword123!@#"}'
```

### 2. Dashboard Access Test
```bash
# Use token from login
curl -X GET https://admin.yourapp.com/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Turf Verification Test
```bash
curl -X POST https://admin.yourapp.com/api/admin/turfs/TURF_ID/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"action":"APPROVE"}'
```

## Maintenance

### Regular Tasks
- Rotate JWT secrets quarterly
- Review admin access logs weekly
- Update dependencies monthly
- Test backup restoration monthly

### Security Updates
- Monitor security advisories
- Update packages promptly
- Review access permissions
- Audit user accounts

## Troubleshooting

### Common Issues

#### Migration Fails
```bash
# Clear and regenerate
rm -rf src/db/migrations/*
pnpm drizzle:generate
pnpm drizzle:migrate
```

#### Admin Login Fails
```bash
# Check user creation
pnpm ts-node src/db/check-user.ts

# Reset password if needed
pnpm ts-node src/db/fix-admin-password.ts
```

#### Token Issues
- Check JWT secrets match between requests
- Verify token expiration (15 minutes)
- Check system time synchronization

### Emergency Procedures

#### Admin Account Lockout
1. Direct database access to reset password
2. Update user status to ACTIVE
3. Regenerate JWT secrets if compromised

#### Database Issues
1. Check connection string
2. Verify database server status
3. Review recent migrations

#### Security Breach
1. Rotate all secrets immediately
2. Review audit logs
3. Force password resets
4. Enable additional monitoring

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrated and seeded
- [ ] SSL certificates installed
- [ ] DNS records configured
- [ ] Firewall rules applied
- [ ] Rate limiting enabled
- [ ] Monitoring set up
- [ ] Backup procedures tested
- [ ] Admin login tested
- [ ] Dashboard functionality verified
- [ ] Security audit completed
- [ ] Documentation updated

## Support

For production issues:
1. Check this documentation
2. Review application logs
3. Consult audit trails
4. Contact development team

## Next Steps

After Super Admin deployment:
1. Implement Turf Admin onboarding flow
2. Add Scorer role management
3. Build subscription billing system
4. Create comprehensive admin dashboard UI
5. Implement advanced security features (2FA, IP whitelisting)
