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
import { teamEnum } from "./enums";

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
     * Batting stats
     */
    runs: integer("runs").default(0).notNull(),
    ballsFaced: integer("balls_faced").default(0).notNull(),
    fours: integer("fours").default(0).notNull(),
    sixes: integer("sixes").default(0).notNull(),

    /**
     * Bowling stats
     */
    wickets: integer("wickets").default(0).notNull(),
    oversBowled: decimal("overs_bowled", { precision: 4, scale: 1 })
      .default("0.0")
      .notNull(),
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
