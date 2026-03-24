import { db } from "../db";
import { plans } from "../db/schema/plans";
import { PLAN } from "../db/schema/enums";

async function seedSubscriptionPlans() {
  console.log("🌱 Seeding subscription plans...");
  
  const plansData = [
    {
      name: PLAN.BASIC,
      priceMonthly: "999", // ₹999/month
      priceYearly: "9999", // ₹9999/year (2 months free)
      featuresJson: JSON.stringify({
        matches: "50 matches per month",
        players: "Up to 100 players",
        scorers: "Up to 5 scorers",
        storage: "1GB storage",
        support: "Email support",
        analytics: "Basic analytics",
        features: [
          "Live scoring",
          "Scorecard sharing",
          "Basic player stats",
          "Match history",
          "Mobile app access"
        ]
      }),
      isActive: true,
    },
    {
      name: PLAN.PRO,
      priceMonthly: "2499", // ₹2499/month
      priceYearly: "24999", // ₹24999/year (2 months free)
      featuresJson: JSON.stringify({
        matches: "Unlimited matches",
        players: "Up to 500 players",
        scorers: "Up to 20 scorers",
        storage: "10GB storage",
        support: "Priority support",
        analytics: "Advanced analytics",
        features: [
          "Everything in BASIC",
          "Advanced player statistics",
          "Team performance metrics",
          "Tournament management",
          "Custom branding",
          "API access",
          "Export reports",
          "Video highlights support"
        ]
      }),
      isActive: true,
    },
    {
      name: PLAN.PREMIUM,
      priceMonthly: "4999", // ₹4999/month
      priceYearly: "49999", // ₹49999/year (2 months free)
      featuresJson: JSON.stringify({
        matches: "Unlimited matches",
        players: "Unlimited players",
        scorers: "Unlimited scorers",
        storage: "100GB storage",
        support: "24/7 dedicated support",
        analytics: "Premium analytics + AI insights",
        features: [
          "Everything in PRO",
          "AI-powered insights",
          "White-label solution",
          "Multiple turf management",
          "Advanced tournament features",
          "Live streaming integration",
          "Custom mobile app",
          "Dedicated account manager",
          "Custom integrations",
          "Advanced security features"
        ]
      }),
      isActive: true,
    },
  ];

  for (const planData of plansData) {
    await db.insert(plans).values(planData).onConflictDoNothing({
      target: plans.name,
    });
  }

  console.log("✅ Subscription plans seeded successfully");
  
  // Display plan information
  console.log("\n📋 Available Subscription Plans:");
  plansData.forEach((plan, index) => {
    const features = JSON.parse(plan.featuresJson);
    console.log(`\n${index + 1}. ${plan.name}`);
    console.log(`   Monthly: ₹${plan.priceMonthly}`);
    console.log(`   Yearly: ₹${plan.priceYearly}`);
    console.log(`   Key features: ${features.features.slice(0, 3).join(", ")}...`);
  });
}

export async function seedPlans() {
  try {
    await seedSubscriptionPlans();
    console.log("🎉 Subscription plans seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding subscription plans:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedPlans()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
