# Database Seeders

This directory contains seeders for populating the cricket scoring platform database with initial static data.

## 🌱 Available Seeders

### 1. **Roles & Permissions** (`seed-roles.ts`)
- Creates 4 roles: SUPER_ADMIN, TURF_ADMIN, SCORER, PLAYER
- Creates 9 permissions with proper RBAC mapping
- Sets up role-permission relationships

### 2. **Subscription Plans** (`seed-plans.ts`)
- Creates 3 subscription tiers: BASIC, PRO, PREMIUM
- Includes pricing, features, and limits
- JSON feature storage for flexibility

### 3. **Demo Subscriptions** (`seed-subscriptions.ts`)
- Creates demo subscriptions for testing
- Creates demo turf if not exists
- Sets up trial subscription for testing

## 🚀 Usage

### Run All Seeders (Static Data Only)
```bash
# From backend directory
pnpm run seed
```

### Run Individual Seeders
```bash
# Seed roles and permissions only
ts-node src/db/seeders/seed-roles.ts

# Seed subscription plans only  
ts-node src/db/seeders/seed-plans.ts

# Seed demo subscriptions only
ts-node src/db/seeders/seed-subscriptions.ts
```

## 📋 Seeding Order

Seeders run in this specific order to maintain dependencies:

1. **Roles & Permissions** (must be first)
2. **Subscription Plans** 
3. **Demo Subscriptions**

This ensures that foreign key constraints are satisfied when creating relationships.

## 🏢 Demo Data Created

### Demo Turf
- **Name**: Demo Cricket Club
- **Email**: demo@cricketclub.com
- **Phone**: +1234567890
- **Status**: VERIFIED
- **Created**: Automatically for subscription testing

### Demo Subscriptions
- **Trial Subscription**: 14-day trial on BASIC plan
- **Purpose**: Testing subscription features and workflows

## 🛡️ Static Data Only

This seeder system only creates static/reference data:
- ✅ Roles and permissions (RBAC setup)
- ✅ Subscription plans (pricing tiers)
- ✅ Demo subscriptions (for testing)
- ❌ **No users** (created via signup flow)

## 🔐 User Creation

Users are created through the application's signup flow:
- **Super Admin**: Email + password + 2FA
- **Turf Admin**: Email + password  
- **Scorer**: Phone + OTP
- **Player**: Phone + OTP

## 🛡️ Production Considerations

### Security
- **Change passwords** before deploying to production
- **Use real 2FA** for super admin accounts
- **Update JWT secrets** in environment variables

### Data
- **Clear existing data** before re-running seeders
- **Use transactions** for data consistency
- **Backup database** before major seeding operations

### Environment
- **Set NODE_ENV** to `development` for demo data
- **Use separate database** for testing/production
- **Configure proper logging** for seeding operations

## 📝 File Structure

```
src/db/seeders/
├── index.ts              # Master seeder (runs all)
├── seed-roles.ts        # Roles & permissions
├── seed-plans.ts        # Subscription plans
├── seed-subscriptions.ts # Demo subscriptions
└── README.md            # This documentation
```

## 🔄 Resetting Database

To clear all data and re-seed:

```bash
# Drop and recreate all tables (development only)
pnpm run drizzle:generate
pnpm run drizzle:migrate

# Re-seed with fresh static data
pnpm run seed
```

## 🎯 Next Steps

After seeding:

1. **Test user signup** through the application
2. **Verify role-based routing** works correctly
3. **Test subscription features** with demo data
4. **Explore dashboards** after user creation
5. **Check subscription management** workflows

The seeders provide a complete foundation for testing and development of the production-grade cricket scoring platform while allowing manual user creation for signup flow testing.
