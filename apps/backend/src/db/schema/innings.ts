import {
  pgTable,
  uuid,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { matches } from "./matches";
import { teamEnum, inningsStatusEnum } from "./enums";
import { players } from "./players";

export const innings = pgTable(
  "innings",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),

    inningsNumber: integer("innings_number").notNull(), // 1 or 2

    battingTeam: teamEnum("batting_team").notNull(),

    // Opening players - stored once at innings start, used only until first ball is delivered
    openingStrikerId: uuid("opening_striker_id").references(() => players.id, {
      onDelete: "set null",
    }),

    openingNonStrikerId: uuid("opening_non_striker_id").references(
      () => players.id,
      { onDelete: "set null" },
    ),

    openingBowlerId: uuid("opening_bowler_id").references(() => players.id, {
      onDelete: "set null",
    }),

    // Current striker tracking - updated after each ball
    currentStrikerId: uuid("current_striker_id").references(() => players.id, {
      onDelete: "set null",
    }),

    currentNonStrikerId: uuid("current_non_striker_id").references(
      () => players.id,
      { onDelete: "set null" },
    ),

    // Current bowler tracking - updated after each over
    currentBowlerId: uuid("current_bowler_id").references(() => players.id, {
      onDelete: "set null",
    }),

    totalRuns: integer("total_runs").default(0).notNull(),
    totalWickets: integer("total_wickets").default(0).notNull(),

    totalBalls: integer("total_balls").default(0).notNull(),

    // Extras breakdown - O(1) performance for scoreboard
    wideRuns: integer("wide_runs").default(0).notNull(),
    noBallRuns: integer("no_ball_runs").default(0).notNull(),
    byeRuns: integer("bye_runs").default(0).notNull(),
    legByeRuns: integer("leg_bye_runs").default(0).notNull(),

    status: inningsStatusEnum("status")
      .default(inningsStatusEnum.enumValues[0])
      .notNull(),

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
  openingStriker: one(players, {
    fields: [innings.openingStrikerId],
    references: [players.id],
  }),
  openingNonStriker: one(players, {
    fields: [innings.openingNonStrikerId],
    references: [players.id],
  }),
  openingBowler: one(players, {
    fields: [innings.openingBowlerId],
    references: [players.id],
  }),
  currentStriker: one(players, {
    fields: [innings.currentStrikerId],
    references: [players.id],
  }),
  currentNonStriker: one(players, {
    fields: [innings.currentNonStrikerId],
    references: [players.id],
  }),
  currentBowler: one(players, {
    fields: [innings.currentBowlerId],
    references: [players.id],
  }),
}));
