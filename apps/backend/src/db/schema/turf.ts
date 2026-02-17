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
  email: varchar("email", { length: 150 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),

  password: text("password").notNull(),

  logoUrl: text("logo_url"),
  address: text("address"),

  isActive: boolean("is_active").default(true).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
