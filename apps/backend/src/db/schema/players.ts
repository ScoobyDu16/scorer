import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { turfs } from "./turfs";

export const players = pgTable(
  "players",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    turfId: uuid("turf_id")
      .notNull()
      .references(() => turfs.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 150 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      uniquePlayerPerTurf: uniqueIndex("unique_player_per_turf").on(
        table.turfId,
        table.name,
        table.phone,
      ),
    };
  },
);
