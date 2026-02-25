import { pgEnum } from "drizzle-orm/pg-core";

export const teamEnum = pgEnum("team", ["A", "B"]);

// Team enum constants
export const TEAM = {
  A: "A" as const,
  B: "B" as const,
} as const;

export const matchStatusEnum = pgEnum("match_status", [
  "CREATED",
  "ACCESS_VERIFIED", 
  "PLAYERS_ADDED",
  "OPENING_PENDING",
  "LIVE",
  "COMPLETED",
]);

// Match status enum constants
export const MATCH_STATUS = {
  CREATED: "CREATED" as const,
  ACCESS_VERIFIED: "ACCESS_VERIFIED" as const,
  PLAYERS_ADDED: "PLAYERS_ADDED" as const,
  OPENING_PENDING: "OPENING_PENDING" as const,
  LIVE: "LIVE" as const,
  COMPLETED: "COMPLETED" as const,
} as const;

export const tossDecisionEnum = pgEnum("toss_decision", ["BAT", "BOWL"]);

// Toss decision enum constants
export const TOSS_DECISION = {
  BAT: "BAT" as const,
  BOWL: "BOWL" as const,
} as const;

export const inningsStatusEnum = pgEnum("innings_status", [
  "UPCOMING",
  "LIVE",
  "COMPLETED",
]);

// Innings status enum constants
export const INNINGS_STATUS = {
  UPCOMING: "UPCOMING" as const,
  LIVE: "LIVE" as const,
  COMPLETED: "COMPLETED" as const,
} as const;

export const resultTypeEnum = pgEnum("result_type", ["RUNS", "WICKETS", "TIE"]);

// Result type enum constants
export const RESULT_TYPE = {
  RUNS: "RUNS" as const,
  WICKETS: "WICKETS" as const,
  TIE: "TIE" as const,
} as const;

// Type helpers for better TypeScript support
export type Team = typeof TEAM[keyof typeof TEAM];
export type MatchStatus = typeof MATCH_STATUS[keyof typeof MATCH_STATUS];
export type TossDecision = typeof TOSS_DECISION[keyof typeof TOSS_DECISION];
export type InningsStatus = typeof INNINGS_STATUS[keyof typeof INNINGS_STATUS];
export type ResultType = typeof RESULT_TYPE[keyof typeof RESULT_TYPE];
