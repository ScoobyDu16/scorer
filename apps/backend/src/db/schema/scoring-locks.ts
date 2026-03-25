import { pgTable, uuid, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

export const scoringLocks = pgTable("scoring_locks", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id").notNull().unique(),
  scorerId: uuid("scorer_id").notNull(),
  lockAcquiredAt: timestamp("lock_acquired_at").defaultNow().notNull(),
  lockExpiresAt: timestamp("lock_expires_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  userAgent: varchar("user_agent", { length: 500 }),
  ipAddress: varchar("ip_address", { length: 45 }),
});

export type ScoringLock = typeof scoringLocks.$inferSelect;
export type NewScoringLock = typeof scoringLocks.$inferInsert;
