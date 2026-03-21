import { db } from "../client";
import { subscriptions, plans, turfs, users } from "../schema";
import { eq } from "drizzle-orm";

/**
 * Seed demo subscriptions for testing
 */
export const seedSubscriptions = async () => {
  try {
    console.log("🌱 Seeding subscriptions...");

    // Get plans
    const basicPlan = await db
      .select()
      .from(plans)
      .where(eq(plans.name, "BASIC"))
      .limit(1);

    const proPlan = await db
      .select()
      .from(plans)
      .where(eq(plans.name, "PRO"))
      .limit(1);

    if (!basicPlan.length) {
      throw new Error("Plans not found. Please run plans seeder first.");
    }

    // Create or get demo turf for subscriptions
    let demoTurf = await db
      .select()
      .from(turfs)
      .where(eq(turfs.name, "Demo Cricket Club"))
      .limit(1);

    if (!demoTurf.length) {
      // Create demo turf if it doesn't exist
      const newTurfs = await db
        .insert(turfs)
        .values({
          name: "Demo Cricket Club",
          slug: "demo-cricket-club",
          email: "demo@cricketclub.com",
          phone: "+1234567890",
          addressLine1: "123 Demo Street, Demo City",
          city: "Demo City",
          state: "Demo State",
          country: "Demo Country",
          pincode: "123456",
          verificationStatus: "VERIFIED",
          isActive: true,
        })
        .returning();
      
      demoTurf = newTurfs;
      console.log("✅ Created demo turf for subscriptions");
    }

    // Create trial subscription
    const trialSubscription = {
      turfId: demoTurf[0].id,
      planId: basicPlan[0].id,
      status: "TRIAL" as const,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      startDate: new Date(),
    };

    const insertedSubscriptions = await db
      .insert(subscriptions)
      .values(trialSubscription)
      .returning();

    console.log(`✅ Inserted ${insertedSubscriptions.length} subscriptions`);
    console.log("🎉 Subscriptions seeded successfully!");

    return insertedSubscriptions;
  } catch (error) {
    console.error("❌ Error seeding subscriptions:", error);
    throw error;
  }
};
