import { db } from "../client";
import { seedRolesAndPermissions } from "./seed-roles";
import { seedPlans } from "./seed-plans";
import { seedSubscriptions } from "./seed-subscriptions";

/**
 * Master seeder that runs all static data seeders
 */
export const seedDatabase = async () => {
  try {
    console.log("🚀 Starting database seeding...");

    // 1. Seed roles and permissions (must be first)
    await seedRolesAndPermissions();

    // 2. Seed subscription plans
    await seedPlans();

    // 3. Seed demo subscriptions (requires plans and turfs)
    await seedSubscriptions();

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📋 Summary:");
    console.log("✅ Roles & Permissions seeded");
    console.log("✅ Subscription Plans seeded");
    console.log("✅ Demo Subscriptions created");
    console.log("\n📝 Note: Static data only. Users can be created via signup flow.");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
};

/**
 * Run seeder if this file is executed directly
 */
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("🎯 Static data seeding completed. Exiting...");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}
