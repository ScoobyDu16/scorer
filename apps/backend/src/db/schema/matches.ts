import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { turfs } from "./turfs";

/**
 * Enums
 */
export const matchStatusEnum = pgEnum("match_status", [
  "UPCOMING",
  "LIVE",
  "COMPLETED",
  "ABANDONED",
]);

export const tossDecisionEnum = pgEnum("toss_decision", ["BAT", "BOWL"]);

export const teamEnum = pgEnum("team", ["A", "B"]);

/**
 * Matches table
 */
export const matches = pgTable("matches", {
  id: uuid("id").defaultRandom().primaryKey(),

  turfId: uuid("turf_id")
    .notNull()
    .references(() => turfs.id, { onDelete: "cascade" }),

  teamAName: varchar("team_a_name", { length: 150 }).notNull(),
  teamBName: varchar("team_b_name", { length: 150 }).notNull(),

  overs: integer("overs").notNull(),

  venue: varchar("venue", { length: 200 }),

  tossWinner: teamEnum("toss_winner"),
  tossDecision: tossDecisionEnum("toss_decision"),

  status: matchStatusEnum("status").default("UPCOMING").notNull(),

  currentInnings: integer("current_innings").default(1).notNull(),
  currentOver: integer("current_over").default(0).notNull(),
  currentBall: integer("current_ball").default(0).notNull(),

  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
