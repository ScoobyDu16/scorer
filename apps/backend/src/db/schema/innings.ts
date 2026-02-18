import {
  pgTable,
  uuid,
  integer,
  decimal,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { matches } from "./matches";
import { teamEnum } from "./enums";

/**
 * Innings status enum
 */
export const inningsStatusEnum = pgEnum("innings_status", [
  "LIVE",
  "COMPLETED",
]);

export const innings = pgTable(
  "innings",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),

    inningsNumber: integer("innings_number").notNull(), // 1 or 2

    battingTeam: teamEnum("batting_team").notNull(),

    totalRuns: integer("total_runs").default(0).notNull(),
    totalWickets: integer("total_wickets").default(0).notNull(),

    totalBalls: integer("total_balls").default(0).notNull(),

    status: inningsStatusEnum("status").default("LIVE").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      uniqueInningsPerMatch: uniqueIndex("unique_innings_per_match").on(
        table.matchId,
        table.inningsNumber,
      ),
    };
  },
);

export const inningsRelations = relations(innings, ({ one }) => ({
  match: one(matches, {
    fields: [innings.matchId],
    references: [matches.id],
  }),
}));
