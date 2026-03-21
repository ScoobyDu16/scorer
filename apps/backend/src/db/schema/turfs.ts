import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const turfVerificationStatusEnum = pgEnum("turf_verification_status", [
  "PENDING",
  "VERIFIED", 
  "REJECTED",
  "SUSPENDED"
]);

export const turfSubscriptionStatusEnum = pgEnum("turf_subscription_status", [
  "TRIAL",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED"
]);

export const turfs = pgTable("turfs", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Basic info
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 150 }).unique(),
  
  // Contact info
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 150 }).notNull().unique(),

  // Business info
  gstNumber: varchar("gst_number", { length: 50 }),

  // Address fields
  addressLine1: text("address_line_1"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).default("India"),
  pincode: varchar("pincode", { length: 10 }),

  // Media
  logoUrl: text("logo_url"),
  mapLocation: text("map_location"),

  // Verification
  verificationStatus: turfVerificationStatusEnum("verification_status").default("PENDING"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: uuid("verified_by").references(() => require("./users").users.id),

  // Subscription
  subscriptionStatus: turfSubscriptionStatusEnum("subscription_status").default("TRIAL"),
  trialEndsAt: timestamp("trial_ends_at"),
  
  // Legacy fields (keeping for compatibility)
  isActive: boolean("is_active").default(true).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Turf = typeof turfs.$inferSelect;
export type NewTurf = typeof turfs.$inferInsert;
