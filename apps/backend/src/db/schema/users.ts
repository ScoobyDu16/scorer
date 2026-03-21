import { pgEnum, pgTable, uuid, varchar, boolean, timestamp, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "BLOCKED"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Authentication fields
  phone: varchar("phone", { length: 20 }).unique(),
  email: varchar("email", { length: 150 }).unique(),
  
  // Profile fields
  name: varchar("name", { length: 150 }).notNull(),
  avatarUrl: text("avatar_url"),
  
  // Password (nullable for OTP-only users)
  passwordHash: varchar("password_hash", { length: 255 }),
  
  // Verification status
  isPhoneVerified: boolean("is_phone_verified").default(false),
  isEmailVerified: boolean("is_email_verified").default(false),
  
  // User status
  status: userStatusEnum("status").default("ACTIVE"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
