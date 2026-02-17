import {
  pgTable,
  uuid,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { matches } from "./matches";
import { innings } from "./innings";
import { players } from "./players";

/**
 * Extras enum
 */
export const extraTypeEnum = pgEnum("extra_type", [
  "WIDE",
  "NO_BALL",
  "BYE",
  "LEG_BYE",
]);

/**
 * Wicket enum
 */
export const wicketTypeEnum = pgEnum("wicket_type", [
  "BOWLED",
  "CAUGHT",
  "RUN_OUT",
  "LBW",
  "STUMPED",
  "HIT_WICKET",
  "RETIRED",
]);

export const balls = pgTable(
  "balls",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),

    inningsId: uuid("innings_id")
      .notNull()
      .references(() => innings.id, { onDelete: "cascade" }),

    overNumber: integer("over_number").notNull(),
    ballNumber: integer("ball_number").notNull(),

    batsmanId: uuid("batsman_id")
      .notNull()
      .references(() => players.id),

    bowlerId: uuid("bowler_id")
      .notNull()
      .references(() => players.id),

    /**
     * Runs from bat
     */
    runs: integer("runs").default(0).notNull(),

    /**
     * Extras
     */
    extraType: extraTypeEnum("extra_type"),
    extraRuns: integer("extra_runs").default(0),

    /**
     * Wicket
     */
    isWicket: boolean("is_wicket").default(false).notNull(),
    wicketType: wicketTypeEnum("wicket_type"),
    dismissedPlayerId: uuid("dismissed_player_id").references(() => players.id),

    /**
     * Legal delivery?
     * Wide / No-ball = false
     */
    isLegalDelivery: boolean("is_legal_delivery").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      matchIndex: index("idx_balls_match").on(table.matchId),
      inningsIndex: index("idx_balls_innings").on(table.inningsId),
      overIndex: index("idx_balls_over").on(
        table.matchId,
        table.inningsId,
        table.overNumber,
      ),
    };
  },
);
