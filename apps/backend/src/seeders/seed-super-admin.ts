import { db } from "../db";
import { users } from "../db/schema/users";
import { roles } from "../db/schema/roles";
import { userRoles } from "../db/schema/user-roles";
import { ROLE } from "../db/schema/enums";
import bcrypt from "bcrypt";
import { eq, and } from "drizzle-orm";

async function seedSuperAdmin() {
  console.log("🌱 Seeding SUPER_ADMIN user...");
  
  // Get SUPER_ADMIN role
  const superAdminRole = await db
    .select()
    .from(roles)
    .where(eq(roles.name, ROLE.SUPER_ADMIN))
    .limit(1);

  if (superAdminRole.length === 0) {
    throw new Error("SUPER_ADMIN role not found. Please run seed-auth.ts first.");
  }

  const roleId = superAdminRole[0].id;

  // Create SUPER_ADMIN user
  const adminEmail = "admin@scorer.app";
  const adminPassword = "admin123456"; // Change this in production!
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = {
    name: "Super Admin",
    email: adminEmail,
    passwordHash: hashedPassword,
    isPhoneVerified: false,
    isEmailVerified: true,
    status: "ACTIVE" as const,
  };

  // Insert user or get existing
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  let userId: string;
  
  if (existingUser.length > 0) {
    userId = existingUser[0].id;
    console.log("✅ SUPER_ADMIN user already exists");
  } else {
    const insertedUser = await db
      .insert(users)
      .values(adminUser)
      .returning({ id: users.id });
    
    userId = insertedUser[0].id;
    console.log("✅ SUPER_ADMIN user created");
  }

  // Assign SUPER_ADMIN role (turfId is null for platform-wide role)
  const existingUserRole = await db
    .select()
    .from(userRoles)
    .where(
      and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId))
    )
    .limit(1);

  if (existingUserRole.length === 0) {
    await db.insert(userRoles).values({
      userId,
      roleId,
      turfId: null, // SUPER_ADMIN has platform scope, not turf-specific
    });
    console.log("✅ SUPER_ADMIN role assigned");
  } else {
    console.log("✅ SUPER_ADMIN role already assigned");
  }

  console.log("🎉 SUPER_ADMIN seeding completed!");
  console.log(`📧 Login: ${adminEmail}`);
  console.log(`🔑 Password: ${adminPassword}`);
  console.log("⚠️  Remember to change the password in production!");
}

export async function seedSuperAdminUser() {
  try {
    await seedSuperAdmin();
  } catch (error) {
    console.error("❌ Error seeding SUPER_ADMIN:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedSuperAdminUser()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
