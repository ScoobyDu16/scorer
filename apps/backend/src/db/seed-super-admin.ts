import { pool } from "./index";
import { users, roles, userRoles, permissions, rolePermissions } from "./schema";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle(pool);

/**
 * Production-grade Super Admin Bootstrap Script
 * 
 * SECURITY NOTES:
 * 1. This script should only be run once in production
 * 2. All secrets should be stored in environment variables
 * 3. After running, delete or secure this script
 * 4. Enable mandatory password change + 2FA on first login
 */

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PHONE = process.env.SUPER_ADMIN_PHONE;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || "Super Admin";

// Validate required environment variables
if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PHONE || !SUPER_ADMIN_PASSWORD) {
  console.error("❌ Missing required environment variables:");
  console.error("- SUPER_ADMIN_EMAIL");
  console.error("- SUPER_ADMIN_PHONE");
  console.error("- SUPER_ADMIN_PASSWORD");
  process.exit(1);
}

async function seedSuperAdmin() {
  console.log("🚀 Starting Super Admin bootstrap...");

  try {
    // Check if super admin already exists
    const existingSuperAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, SUPER_ADMIN_EMAIL!))
      .limit(1);

    if (existingSuperAdmin.length > 0) {
      console.log("⚠️  Super Admin already exists. Skipping bootstrap.");
      return;
    }

    // Create roles
    const roleData = [
      { name: "SUPER_ADMIN" },
      { name: "TURF_ADMIN" },
      { name: "SCORER" },
      { name: "PLAYER" },
    ];

    const insertedRoles = await db.insert(roles).values(roleData).returning();
    console.log("✅ Created roles:", insertedRoles.map(r => r.name));

    // Create permissions
    const permissionData = [
      { name: "MANAGE_TURF" },
      { name: "MANAGE_PLAYERS" },
      { name: "MANAGE_MATCHES" },
      { name: "SCORE_MATCH" },
      { name: "VIEW_STATS" },
      { name: "MANAGE_SUBSCRIPTIONS" },
      { name: "MANAGE_PLATFORM" },
      { name: "MANAGE_USERS" },
      { name: "VERIFY_TURF" },
    ];

    const insertedPermissions = await db.insert(permissions).values(permissionData).returning();
    console.log("✅ Created permissions:", insertedPermissions.map(p => p.name));

    // Assign permissions to roles
    const superAdminRole = insertedRoles.find(r => r.name === "SUPER_ADMIN");
    const turfAdminRole = insertedRoles.find(r => r.name === "TURF_ADMIN");
    const scorerRole = insertedRoles.find(r => r.name === "SCORER");
    const playerRole = insertedRoles.find(r => r.name === "PLAYER");

    // Super Admin gets all permissions
    const superAdminPermissions = insertedPermissions.map(p => ({
      roleId: superAdminRole!.id,
      permissionId: p.id,
    }));

    // Turf Admin permissions
    const turfAdminPermissions = insertedPermissions
      .filter(p => ["MANAGE_PLAYERS", "MANAGE_MATCHES", "VIEW_STATS"].includes(p.name))
      .map(p => ({
        roleId: turfAdminRole!.id,
        permissionId: p.id,
      }));

    // Scorer permissions
    const scorerPermissions = insertedPermissions
      .filter(p => ["SCORE_MATCH", "VIEW_STATS"].includes(p.name))
      .map(p => ({
        roleId: scorerRole!.id,
        permissionId: p.id,
      }));

    // Player permissions
    const playerPermissions = insertedPermissions
      .filter(p => ["VIEW_STATS"].includes(p.name))
      .map(p => ({
        roleId: playerRole!.id,
        permissionId: p.id,
      }));

    await db.insert(rolePermissions).values([
      ...superAdminPermissions,
      ...turfAdminPermissions,
      ...scorerPermissions,
      ...playerPermissions,
    ]);

    console.log("✅ Assigned permissions to roles");

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD!, 12);

    // Create super admin user
    const superAdminUser = await db.insert(users).values({
      email: SUPER_ADMIN_EMAIL!,
      phone: SUPER_ADMIN_PHONE!,
      name: SUPER_ADMIN_NAME!,
      passwordHash,
      isEmailVerified: true, // Manually verified during bootstrap
      isPhoneVerified: true, // Manually verified during bootstrap
      status: "ACTIVE",
    }).returning();

    console.log("✅ Created Super Admin user:", {
      id: superAdminUser[0].id,
      email: superAdminUser[0].email,
      phone: superAdminUser[0].phone,
      name: superAdminUser[0].name,
    });

    // Assign SUPER_ADMIN role to user
    await db.insert(userRoles).values({
      userId: superAdminUser[0].id,
      roleId: superAdminRole!.id,
      turfId: null, // Super Admin has platform scope, no turf restriction
    });

    console.log("✅ Assigned SUPER_ADMIN role to user");

    console.log("\n🎉 Super Admin bootstrap completed successfully!");
    console.log("\n📋 NEXT STEPS:");
    console.log("1. Delete or secure this seed script");
    console.log("2. Implement mandatory password change on first login");
    console.log("3. Enable 2FA enrollment requirement");
    console.log("4. Set up admin domain (admin.yourapp.com)");
    console.log("5. Configure JWT secrets and refresh token rotation");
    console.log("6. Enable audit logging for admin actions");

  } catch (error) {
    console.error("❌ Error during Super Admin bootstrap:", error);
    process.exit(1);
  }
}

// Run the seed function
seedSuperAdmin()
  .then(() => {
    console.log("✅ Seed script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
