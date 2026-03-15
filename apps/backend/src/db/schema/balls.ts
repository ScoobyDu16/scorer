import {
  pgTable,
  uuid,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { matches } from "./matches";
import { innings } from "./innings";
import { players } from "./players";

import { extraTypeEnum, wicketTypeEnum } from "./enums";

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
    fielderId: uuid("fielder_id").references(() => players.id),

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
