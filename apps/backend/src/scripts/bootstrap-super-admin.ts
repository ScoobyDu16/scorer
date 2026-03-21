import { db } from '../db/client';
import { users, userRoles, roles } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

/**
 * Bootstrap Super Admin Script
 * Creates the first super admin user for the system
 * This should only be run once in a fresh environment
 */

async function bootstrapSuperAdmin() {
  try {
    console.log('🚀 Starting super admin bootstrap...');

    // Check if super admin already exists
    const existingSuperAdmin = await db
      .select()
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(roles.name, 'SUPER_ADMIN'))
      .limit(1);

    if (existingSuperAdmin.length > 0) {
      console.log('⚠️  Super admin already exists. Skipping bootstrap.');
      console.log(`📧 Email: ${existingSuperAdmin[0].users.email}`);
      console.log(`📱 Phone: ${existingSuperAdmin[0].users.phone}`);
      return;
    }

    // Get SUPER_ADMIN role
    const superAdminRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'SUPER_ADMIN'))
      .limit(1);

    if (!superAdminRole.length) {
      throw new Error('SUPER_ADMIN role not found. Please run seeders first.');
    }

    // Create super admin user
    const email = 'superadmin@cricketscorer.com';
    const phone = '+1234567890';
    const password = 'SuperAdmin@123!'; // Change this in production
    const name = 'Super Admin';

    console.log('📧 Creating super admin with email:', email);
    console.log('📱 Phone:', phone);
    console.log('🔑 Default password:', password);
    console.log('⚠️  Please change the password after first login!');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        name,
        email,
        phone,
        passwordHash,
        isEmailVerified: true,
        isPhoneVerified: true,
        status: 'ACTIVE',
      })
      .returning();

    // Assign super admin role
    await db.insert(userRoles).values({
      userId: newUser[0].id,
      roleId: superAdminRole[0].id,
    });

    console.log('✅ Super admin created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔑 Password: ${password}`);
    console.log('🎯 You can now login with these credentials.');
    console.log('🔐 Please change the password and enable 2FA immediately after login.');

    // Log the bootstrap action
    console.log('📋 Bootstrap completed. System is ready for invitation-based admin registration.');

  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

// Run bootstrap if this file is executed directly
if (require.main === module) {
  bootstrapSuperAdmin()
    .then(() => {
      console.log('🎯 Bootstrap completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Bootstrap failed:', error);
      process.exit(1);
    });
}

export default bootstrapSuperAdmin;
