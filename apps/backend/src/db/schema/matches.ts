import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { turfs } from "./turfs";
import { innings } from "./innings";
import {
  teamEnum,
  matchStatusEnum,
  tossDecisionEnum,
  resultTypeEnum,
} from "./enums";
import { players } from "./players";

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

  status: matchStatusEnum("status").default("CREATED").notNull(),

  currentInnings: integer("current_innings").default(1).notNull(),

  winner: teamEnum("winner"),

  resultType: resultTypeEnum("result_type"),

  resultMargin: integer("result_margin"),

  manOfTheMatchPlayerId: uuid("man_of_the_match_player_id").references(
    () => players.id,
  ),

  playersPerTeam: integer("players_per_team").default(11).notNull(),

  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),

  // Scoring lock fields
  activeScorerId: uuid("active_scorer_id"), // User ID of currently active scorer
  scorerSessionId: uuid("scorer_session_id"), // Unique session ID for scoring session
  lockExpiresAt: timestamp("lock_expires_at"), // When the scoring lock expires

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const matchesRelations = relations(matches, ({ one, many }) => ({
  turf: one(turfs, {
    fields: [matches.turfId],
    references: [turfs.id],
  }),
  innings: many(innings),
}));
