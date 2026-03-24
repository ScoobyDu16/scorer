import { pgTable, uuid, varchar, boolean, timestamp, text } from "drizzle-orm/pg-core";
import { planEnum } from "./enums";

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: planEnum("name").notNull().unique(),
  
  // Pricing
  priceMonthly: varchar("price_monthly", { length: 10 }), // in rupees
  priceYearly: varchar("price_yearly", { length: 10 }), // in rupees
  
  // Features stored as JSON
  featuresJson: text("features_json"), // JSON string of features
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
