import { pgEnum } from "drizzle-orm/pg-core";

export const teamEnum = pgEnum("team", ["A", "B"]);

export const matchStatusEnum = pgEnum("match_status", [
  "UPCOMING",
  "LIVE",
  "COMPLETED",
]);

export const tossDecisionEnum = pgEnum("toss_decision", ["BAT", "BOWL"]);

export const inningsStatusEnum = pgEnum("innings_status", [
  "LIVE",
  "COMPLETED",
]);
