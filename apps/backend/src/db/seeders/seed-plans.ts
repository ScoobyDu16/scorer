import { db } from "../client";
import { plans } from "../schema";

/**
 * Seed subscription plans data
 */
export const seedPlans = async () => {
  try {
    console.log("🌱 Seeding subscription plans...");

    const planData = [
      {
        name: "BASIC",
        priceMonthly: "999.00",
        priceYearly: "9999.00",
        featuresJson: JSON.stringify({
          maxPlayers: 50,
          maxMatchesPerMonth: 20,
          maxScorers: 2,
          features: [
            "Basic match scoring",
            "Player management",
            "Basic statistics",
            "Email support"
          ]
        }),
        maxPlayers: 50,
        maxMatchesPerMonth: 20,
        maxScorers: 2,
      },
      {
        name: "PRO",
        priceMonthly: "1999.00",
        priceYearly: "19999.00",
        featuresJson: JSON.stringify({
          maxPlayers: 200,
          maxMatchesPerMonth: 100,
          maxScorers: 5,
          features: [
            "Advanced match scoring",
            "Player management",
            "Detailed statistics",
            "Leaderboard access",
            "Priority support",
            "Custom branding",
            "API access"
          ]
        }),
        maxPlayers: 200,
        maxMatchesPerMonth: 100,
        maxScorers: 5,
      },
      {
        name: "PREMIUM",
        priceMonthly: "4999.00",
        priceYearly: "49999.00",
        featuresJson: JSON.stringify({
          maxPlayers: 1000,
          maxMatchesPerMonth: 500,
          maxScorers: 20,
          features: [
            "Enterprise match scoring",
            "Unlimited player management",
            "Advanced analytics",
            "Custom leaderboards",
            "White-label solution",
            "Dedicated support",
            "Full API access",
            "Multi-turf management",
            "Advanced reporting"
          ]
        }),
        maxPlayers: 1000,
        maxMatchesPerMonth: 500,
        maxScorers: 20,
      },
    ];

    const insertedPlans = await db
      .insert(plans)
      .values(planData)
      .returning();

    console.log(`✅ Inserted ${insertedPlans.length} subscription plans`);
    console.log("🎉 Subscription plans seeded successfully!");

    return insertedPlans;
  } catch (error) {
    console.error("❌ Error seeding subscription plans:", error);
    throw error;
  }
};
