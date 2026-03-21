import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { roles } from "./roles";
import { turfs } from "./turfs";

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  turfId: uuid("turf_id").references(() => turfs.id, { onDelete: "cascade" }), // NULL for SUPER_ADMIN
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRoleRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  turf: one(turfs, {
    fields: [userRoles.turfId],
    references: [turfs.id],
  }),
}));

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
