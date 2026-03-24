import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { subscriptionStatusEnum } from "./enums";
import { turfs } from "./turfs";
import { plans } from "./plans";

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  turfId: uuid("turf_id").notNull().references(() => turfs.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  
  // Status
  status: subscriptionStatusEnum("status").default("TRIAL"),
  
  // Dates
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  
  // Payment provider info
  paymentProvider: varchar("payment_provider", { length: 100 }), // e.g., "stripe", "razorpay"
  paymentSubscriptionId: varchar("payment_subscription_id", { length: 255 }),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
