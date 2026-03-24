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
  "LIVE",
  "COMPLETED",
]);

// Match status enum constants
export const MATCH_STATUS = {
  CREATED: "CREATED" as const,
  ACCESS_VERIFIED: "ACCESS_VERIFIED" as const,
  PLAYERS_ADDED: "PLAYERS_ADDED" as const,
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

export const extraTypeEnum = pgEnum("extra_type", [
  "WIDE",
  "NO_BALL",
  "BYE",
  "LEG_BYE",
]);

export const EXTRA_TYPE = {
  WIDE: "WIDE" as const,
  NO_BALL: "NO_BALL" as const,
  BYE: "BYE" as const,
  LEG_BYE: "LEG_BYE" as const,
} as const;

export const wicketTypeEnum = pgEnum("wicket_type", [
  "BOWLED",
  "CAUGHT",
  "CAUGHT_AND_BOWLED",
  "RUN_OUT",
  "LBW",
  "STUMPED",
  "HIT_WICKET",
]);

export const WICKET_TYPE = {
  BOWLED: "BOWLED" as const,
  CAUGHT: "CAUGHT" as const,
  CAUGHT_AND_BOWLED: "CAUGHT_AND_BOWLED" as const,
  RUN_OUT: "RUN_OUT" as const,
  LBW: "LBW" as const,
  STUMPED: "STUMPED" as const,
  HIT_WICKET: "HIT_WICKET" as const,
} as const;

export const dismissalTypeEnum = pgEnum("dismissal_type", [
  "BOWLED",
  "CAUGHT",
  "CAUGHT_AND_BOWLED",
  "RUN_OUT",
  "LBW",
  "STUMPED",
  "HIT_WICKET",
  "RETIRED",
]);

export const DISMISSAL_TYPE = {
  BOWLED: "BOWLED" as const,
  CAUGHT: "CAUGHT" as const,
  CAUGHT_AND_BOWLED: "CAUGHT_AND_BOWLED" as const,
  RUN_OUT: "RUN_OUT" as const,
  LBW: "LBW" as const,
  STUMPED: "STUMPED" as const,
  HIT_WICKET: "HIT_WICKET" as const,
  RETIRED: "RETIRED" as const,
} as const;

// User role enums
export const roleEnum = pgEnum("role", [
  "SUPER_ADMIN",
  "TURF_ADMIN", 
  "SCORER",
  "PLAYER"
]);

export const ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN" as const,
  TURF_ADMIN: "TURF_ADMIN" as const,
  SCORER: "SCORER" as const,
  PLAYER: "PLAYER" as const,
} as const;

// User status enums
export const userStatusEnum = pgEnum("user_status", [
  "ACTIVE",
  "BLOCKED"
]);

export const USER_STATUS = {
  ACTIVE: "ACTIVE" as const,
  BLOCKED: "BLOCKED" as const,
} as const;

// Turf verification status enums
export const turfVerificationStatusEnum = pgEnum("turf_verification_status", [
  "PENDING",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED"
]);

export const TURF_VERIFICATION_STATUS = {
  PENDING: "PENDING" as const,
  VERIFIED: "VERIFIED" as const,
  REJECTED: "REJECTED" as const,
  SUSPENDED: "SUSPENDED" as const,
} as const;

// Subscription status enums
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "TRIAL",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED"
]);

export const SUBSCRIPTION_STATUS = {
  TRIAL: "TRIAL" as const,
  ACTIVE: "ACTIVE" as const,
  EXPIRED: "EXPIRED" as const,
  CANCELLED: "CANCELLED" as const,
} as const;

// Subscription plan enums
export const planEnum = pgEnum("plan", [
  "BASIC",
  "PRO",
  "PREMIUM"
]);

export const PLAN = {
  BASIC: "BASIC" as const,
  PRO: "PRO" as const,
  PREMIUM: "PREMIUM" as const,
} as const;

// Type helpers for better TypeScript support
export type Team = typeof TEAM[keyof typeof TEAM];
export type MatchStatus = typeof MATCH_STATUS[keyof typeof MATCH_STATUS];
export type TossDecision = typeof TOSS_DECISION[keyof typeof TOSS_DECISION];
export type InningsStatus = typeof INNINGS_STATUS[keyof typeof INNINGS_STATUS];
export type ResultType = typeof RESULT_TYPE[keyof typeof RESULT_TYPE];
export type ExtraType = typeof EXTRA_TYPE[keyof typeof EXTRA_TYPE];
export type WicketType = typeof WICKET_TYPE[keyof typeof WICKET_TYPE];
export type DismissalType = typeof DISMISSAL_TYPE[keyof typeof DISMISSAL_TYPE];
export type Role = typeof ROLE[keyof typeof ROLE];
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];
export type TurfVerificationStatus = typeof TURF_VERIFICATION_STATUS[keyof typeof TURF_VERIFICATION_STATUS];
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];
export type Plan = typeof PLAN[keyof typeof PLAN];
