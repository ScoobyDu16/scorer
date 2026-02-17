import {
  pgTable,
  uuid,
  timestamp,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { matches, teamEnum } from "./matches";
import { players } from "./players";

export const matchPlayers = pgTable(
  "match_players",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),

    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),

    team: teamEnum("team").notNull(),

    isPlaying: boolean("is_playing").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      uniquePlayerPerMatch: uniqueIndex("unique_player_per_match").on(
        table.matchId,
        table.playerId,
      ),
    };
  },
);
