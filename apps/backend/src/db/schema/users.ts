import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    phone: varchar("phone", { length: 20 }).unique(),
    email: varchar("email", { length: 150 }).unique(),

    name: varchar("name", { length: 150 }),
    avatarUrl: text("avatar_url"),

    passwordHash: text("password_hash"),

    isPhoneVerified: boolean("is_phone_verified").default(false).notNull(),
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),

    status: varchar("status", { length: 20 }).default("ACTIVE").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      uniquePhone: uniqueIndex("unique_phone").on(table.phone),
      uniqueEmail: uniqueIndex("unique_email").on(table.email),
    };
  },
);
