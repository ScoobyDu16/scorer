import { seedAuthData } from "./seed-auth";
import { seedSuperAdminUser } from "./seed-super-admin";
import { seedPlans } from "./seed-plans";

async function seedAll() {
  console.log("🚀 Starting complete database seeding...\n");
  
  try {
    // Step 1: Seed roles, permissions, and role-permissions
    console.log("📋 Step 1: Seeding authentication data...");
    await seedAuthData();
    console.log("✅ Step 1 completed!\n");
    
    // Step 2: Seed SUPER_ADMIN user
    console.log("👤 Step 2: Seeding SUPER_ADMIN user...");
    await seedSuperAdminUser();
    console.log("✅ Step 2 completed!\n");
    
    // Step 3: Seed subscription plans
    console.log("💳 Step 3: Seeding subscription plans...");
    await seedPlans();
    console.log("✅ Step 3 completed!\n");
    
    console.log("🎉 All seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log("   ✅ Roles and permissions seeded");
    console.log("   ✅ SUPER_ADMIN user created");
    console.log("   ✅ Subscription plans created");
    console.log("\n🔑 Next steps:");
    console.log("   1. Run migrations: npm run drizzle:migrate");
    console.log("   2. Start the server: npm run dev");
    console.log("   3. Login as SUPER_ADMIN at admin@scorer.app / admin123456");
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAll()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedAll };
