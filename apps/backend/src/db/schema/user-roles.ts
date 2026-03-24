import { pgTable, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./users";
import { roles } from "./roles";
import { turfs } from "./turfs";

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  turfId: uuid("turf_id").references(() => turfs.id, { onDelete: "cascade" }), // nullable for SUPER_ADMIN
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Composite unique constraint to ensure a user can only have one role per turf
export const userRolesUnique = primaryKey({ columns: [userRoles.userId, userRoles.turfId] });

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
