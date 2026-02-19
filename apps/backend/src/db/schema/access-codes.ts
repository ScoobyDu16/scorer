import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { turfs } from "./turfs";
import { matches } from "./matches";

export const accessCodes = pgTable(
  "access_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    turfId: uuid("turf_id")
      .notNull()
      .references(() => turfs.id, { onDelete: "cascade" }),

    code: varchar("code", { length: 6 }).notNull(),

    expiresAt: timestamp("expires_at").notNull(),

    isUsed: boolean("is_used").default(false).notNull(),

    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      uniqueCodePerTurf: uniqueIndex("unique_code_per_turf").on(
        table.turfId,
        table.code,
      ),
    };
  },
);
