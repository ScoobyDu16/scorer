import {
  pgTable,
  uuid,
  integer,
  decimal,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { matches } from "./matches";
import { players } from "./players";
import { teamEnum, dismissalTypeEnum } from "./enums";

export const playerMatchStats = pgTable(
  "player_match_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),

    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),

    team: teamEnum("team").notNull(),

    /**
     * Batting order (null for players who didn't bat)
     */
    battingOrder: integer("batting_order"),

    /**
     * Batting stats
     */
    runs: integer("runs").default(0).notNull(),
    ballsFaced: integer("balls_faced").default(0).notNull(),
    dotsFaced: integer("dots_faced").default(0).notNull(),
    fours: integer("fours").default(0).notNull(),
    sixes: integer("sixes").default(0).notNull(),

    dismissalType: dismissalTypeEnum("dismissal_type"),

    /**
     * Bowling stats
     */
    wickets: integer("wickets").default(0).notNull(),
    ballsBowled: integer("balls_bowled").default(0).notNull(),
    dotsBowled: integer("dots_bowled").default(0).notNull(),
    maidens: integer("maidens").default(0).notNull(),

    runsConceded: integer("runs_conceded").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      uniquePlayerMatch: uniqueIndex("unique_player_match").on(
        table.matchId,
        table.playerId,
      ),
    };
  },
);
