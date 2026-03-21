import { pgEnum, pgTable, uuid, varchar, boolean, timestamp, text, integer, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { turfs } from "./turfs";

export const planEnum = pgEnum("plan", [
  "BASIC",
  "PRO", 
  "PREMIUM"
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "TRIAL",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED"
]);

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: planEnum("name").notNull().unique(),
  
  // Pricing
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }).notNull(),
  
  // Features stored as JSON
  featuresJson: text("features_json"),
  
  // Limits
  maxPlayers: integer("max_players").default(100),
  maxMatchesPerMonth: integer("max_matches_per_month").default(50),
  maxScorers: integer("max_scorers").default(5),
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  turfId: uuid("turf_id").notNull().references(() => turfs.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  
  status: subscriptionStatusEnum("status").default("TRIAL").notNull(),
  
  // Dates
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  cancelledAt: timestamp("cancelled_at"),
  
  // Payment provider info
  paymentProvider: varchar("payment_provider", { length: 50 }), // stripe, razorpay, etc
  paymentSubscriptionId: varchar("payment_subscription_id", { length: 255 }),
  
  // Pricing at time of subscription
  pricePaid: decimal("price_paid", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("INR"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const planRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  turf: one(turfs, {
    fields: [subscriptions.turfId],
    references: [turfs.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
}));

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
