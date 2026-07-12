import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { turfVerificationStatusEnum, subscriptionStatusEnum } from "./enums";

export const turfs = pgTable("turfs", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Basic info
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  
  // Contact info
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 150 }),

  // Business info
  gstNumber: varchar("gst_number", { length: 20 }),

  // Address fields
  addressLine1: varchar("address_line_1", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).default("India"),
  pincode: varchar("pincode", { length: 10 }),

  // Media
  logoUrl: varchar("logo_url", { length: 500 }),
  mapLocation: varchar("map_location", { length: 500 }),

  // Verification status
  verificationStatus: turfVerificationStatusEnum("verification_status").default("PENDING"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: uuid("verified_by"), // SUPER_ADMIN who verified

  // Subscription status
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("TRIAL"),

  // Legacy fields (keeping for backward compatibility)
  isActive: boolean("is_active").default(true).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
