import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const turfs = pgTable("turfs", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 150 }),
  
  gstNumber: varchar("gst_number", { length: 20 }),

  addressLine1: text("address_line_1"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).default("India"),
  pincode: varchar("pincode", { length: 10 }),

  logoUrl: text("logo_url"),
  mapLocation: text("map_location"),

  verificationStatus: varchar("verification_status", { length: 20 }).default("PENDING").notNull(),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: uuid("verified_by"),

  subscriptionStatus: varchar("subscription_status", { length: 20 }).default("TRIAL").notNull(),

  isActive: boolean("is_active").default(true).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
