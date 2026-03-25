import { Router, Response } from "express";
import { db } from "../db";
import { turfs, users, subscriptions, plans, userRoles, roles } from "../db/schema";
import { eq, count } from "drizzle-orm";
import { AuthenticatedRequest, authenticateToken } from "../middleware/auth";
import bcrypt from "bcrypt";
import { generateTokens } from "../middleware/auth";

const router = Router();

// Public endpoints (no authentication required)
router.post("/register", async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log(" Turf Registration Request:", {
      body: req.body,
      hasRequiredFields: !!(req.body.name && req.body.email && req.body.adminName && req.body.adminEmail && req.body.adminPassword)
    });

    const {
      // Turf details
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      gstNumber,
      
      // Admin user details
      adminName,
      adminEmail,
      adminPhone,
      adminPassword,
      
      // Subscription plan
      planId,
    } = req.body;

    // Validate required fields
    if (!name || !email || !adminName || !adminEmail || !adminPassword) {
      console.log(" Validation failed - missing fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(" Validation passed, checking existing records...");

    // Check if turf email already exists
    const existingTurf = await db
      .select()
      .from(turfs)
      .where(eq(turfs.email, email))
      .limit(1);

    if (existingTurf.length > 0) {
      return res.status(400).json({ error: "Turf email already registered" });
    }

    // Check if admin email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Admin email already registered" });
    }

    // Start transaction
    console.log(" Starting database transaction...");
    const result = await db.transaction(async (tx) => {
      console.log(" Transaction started, creating turf...");
      
      // Create turf
      const [newTurf] = await tx
        .insert(turfs)
        .values({
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          email,
          phone,
          addressLine1: address,
          city,
          state,
          pincode,
          gstNumber,
          verificationStatus: "PENDING",
          subscriptionStatus: "TRIAL",
        })
        .returning();

      console.log(" Turf created:", newTurf.id);

      // Create admin user
      console.log(" Creating admin user...");
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const [newUser] = await tx
        .insert(users)
        .values({
          name: adminName,
          email: adminEmail,
          phone: adminPhone,
          passwordHash,
          status: "ACTIVE",
        })
        .returning();

      console.log(" Admin user created:", newUser.id);

      // Get TURF_ADMIN role
      console.log(" Getting TURF_ADMIN role...");
      const [turfAdminRole] = await tx
        .select()
        .from(roles)
        .where(eq(roles.name, "TURF_ADMIN"))
        .limit(1);

      if (!turfAdminRole) {
        console.log(" TURF_ADMIN role not found!");
        throw new Error("TURF_ADMIN role not found");
      }

      console.log(" TURF_ADMIN role found:", turfAdminRole.id);

      // Assign TURF_ADMIN role to user
      console.log(" Assigning role to user...");
      await tx.insert(userRoles).values({
        userId: newUser.id,
        roleId: turfAdminRole.id,
        turfId: newTurf.id,
      });

      console.log(" Role assigned successfully");

      // Create trial subscription
      console.log(" Creating trial subscription...");
      let trialPlan;
      
      if (planId) {
        console.log(" Using provided planId:", planId);
        const [providedPlan] = await tx.select().from(plans).where(eq(plans.id, planId)).limit(1);
        trialPlan = providedPlan;
      } else {
        console.log(" No planId provided, getting BASIC plan...");
        const [basicPlan] = await tx.select().from(plans).where(eq(plans.name, "BASIC")).limit(1);
        trialPlan = basicPlan;
      }
      
      if (trialPlan) {
        console.log(" Using plan:", trialPlan.name, trialPlan.id);
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 30); // 30-day trial

        await tx.insert(subscriptions).values({
          turfId: newTurf.id,
          planId: trialPlan.id,
          status: "TRIAL",
          startDate: new Date(),
          trialEndsAt,
        });

        console.log(" Trial subscription created with planId:", trialPlan.id);
      } else {
        console.log(" No plan found, skipping subscription creation");
      }

      console.log(" Transaction completed successfully");
      return { turf: newTurf, user: newUser };
    });

    // Generate tokens for the admin user
    const tokens = generateTokens(result.user.id);

    res.status(201).json({
      message: "Turf registration successful",
      turf: result.turf,
      admin: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
      },
      tokens,
    });
  } catch (error) {
    console.error(" Turf registration error:", error);
    if (error instanceof Error) {
      console.error(" Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } else {
      console.error(" Unknown error:", error);
    }
    res.status(500).json({ error: "Failed to register turf" });
  }
});

// Complete onboarding (after registration)
router.post("/onboarding/complete", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      // Additional turf details
      description,
      facilities,
      operatingHours,
      rules,
      
      // Bank details for subscription
      bankAccountNumber,
      bankIfsc,
      bankAccountName,
      
      // Social media
      website,
      instagram,
      facebook,
      twitter,
    } = req.body;

    if (!req.user?.turfId) {
      return res.status(403).json({ error: "Turf access required" });
    }

    // Update turf with additional details
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (description) updateData.description = description;
    if (facilities) updateData.facilities = facilities;
    if (operatingHours) updateData.operatingHours = operatingHours;
    if (rules) updateData.rules = rules;
    if (bankAccountNumber) updateData.bankAccountNumber = bankAccountNumber;
    if (bankIfsc) updateData.bankIfsc = bankIfsc;
    if (bankAccountName) updateData.bankAccountName = bankAccountName;
    if (website) updateData.website = website;
    if (instagram) updateData.instagram = instagram;
    if (facebook) updateData.facebook = facebook;
    if (twitter) updateData.twitter = twitter;

    const updatedTurf = await db
      .update(turfs)
      .set(updateData)
      .where(eq(turfs.id, req.user.turfId))
      .returning();

    if (updatedTurf.length === 0) {
      return res.status(404).json({ error: "Turf not found" });
    }

    res.json({
      message: "Onboarding completed successfully",
      turf: updatedTurf[0],
    });
  } catch (error) {
    console.error("Complete onboarding error:", error);
    res.status(500).json({ error: "Failed to complete onboarding" });
  }
});

// Get available plans for registration
router.get("/plans", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const plansData = await db
      .select({
        id: plans.id,
        name: plans.name,
        priceMonthly: plans.priceMonthly,
        priceYearly: plans.priceYearly,
        featuresJson: plans.featuresJson,
        isActive: plans.isActive,
      })
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(plans.priceMonthly);

    res.json({
      plans: plansData,
    });
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// Check if email is available for registration
router.post("/check-availability", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, type } = req.body; // type: 'turf' or 'user'

    if (!email || !type) {
      return res.status(400).json({ error: "Email and type are required" });
    }

    if (type === "turf") {
      const existingTurf = await db
        .select()
        .from(turfs)
        .where(eq(turfs.email, email))
        .limit(1);

      res.json({
        available: existingTurf.length === 0,
      });
    } else if (type === "user") {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      res.json({
        available: existingUser.length === 0,
      });
    } else {
      return res.status(400).json({ error: "Invalid type. Must be 'turf' or 'user'" });
    }
  } catch (error) {
    console.error("Check availability error:", error);
    res.status(500).json({ error: "Failed to check availability" });
  }
});

// Upgrade subscription plan
router.post("/upgrade-plan", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.turfId) {
      return res.status(403).json({ error: "Turf access required" });
    }

    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: "Plan ID is required" });
    }

    // Get plan details
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Check if user already has an active subscription
    const [existingSubscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.turfId, req.user.turfId))
      .limit(1);

    if (existingSubscription && existingSubscription.status === "ACTIVE") {
      return res.status(400).json({ error: "Active subscription already exists" });
    }

    // Create new subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month from now

    const [newSubscription] = await db
      .insert(subscriptions)
      .values({
        turfId: req.user.turfId,
        planId,
        status: "ACTIVE",
        startDate,
        endDate,
      })
      .returning();

    // Update turf subscription status
    await db
      .update(turfs)
      .set({ subscriptionStatus: "ACTIVE" })
      .where(eq(turfs.id, req.user.turfId));

    res.json({
      message: "Subscription upgraded successfully",
      subscription: newSubscription,
      plan,
    });
  } catch (error) {
    console.error("Upgrade plan error:", error);
    res.status(500).json({ error: "Failed to upgrade plan" });
  }
});

export default router;
