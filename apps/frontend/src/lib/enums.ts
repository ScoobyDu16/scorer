/**
 * Frontend enum constants - matches backend enums exactly
 * Provides type-safe enum usage without fragile indices
 */

// Team enum constants
export const TEAM = {
  A: "A" as const,
  B: "B" as const,
} as const;

// Match status enum constants
export const MATCH_STATUS = {
  CREATED: "CREATED" as const,
  ACCESS_VERIFIED: "ACCESS_VERIFIED" as const,
  PLAYERS_ADDED: "PLAYERS_ADDED" as const,
  LIVE: "LIVE" as const,
  COMPLETED: "COMPLETED" as const,
} as const;

// Toss decision enum constants
export const TOSS_DECISION = {
  BAT: "BAT" as const,
  BOWL: "BOWL" as const,
} as const;

// Innings status enum constants
export const INNINGS_STATUS = {
  UPCOMING: "UPCOMING" as const,
  LIVE: "LIVE" as const,
  COMPLETED: "COMPLETED" as const,
} as const;

// Result type enum constants
export const RESULT_TYPE = {
  RUNS: "RUNS" as const,
  WICKETS: "WICKETS" as const,
  TIE: "TIE" as const,
} as const;

// Wicket type enum constants
export const WICKET_TYPE = {
  BOWLED: "BOWLED" as const,
  CAUGHT: "CAUGHT" as const,
  CAUGHT_AND_BOWLED: "CAUGHT_AND_BOWLED" as const,
  RUN_OUT: "RUN_OUT" as const,
  LBW: "LBW" as const,
  STUMPED: "STUMPED" as const,
  HIT_WICKET: "HIT_WICKET" as const,
  RETIRED_HURT: "RETIRED_HURT" as const,
  OBSTRUCTING_FIELD: "OBSTRUCTING_FIELD" as const,
  HIT_BALL_TWICE: "HIT_BALL_TWICE" as const,
} as const;

// Extra type enum constants
export const EXTRA_TYPE = {
  WIDE: "WIDE" as const,
  NO_BALL: "NO_BALL" as const,
  BYES: "BYES" as const,
  LEG_BYES: "LEG_BYES" as const,
} as const;

// Type helpers for better TypeScript support
export type Team = typeof TEAM[keyof typeof TEAM];
export type MatchStatus = typeof MATCH_STATUS[keyof typeof MATCH_STATUS];
export type TossDecision = typeof TOSS_DECISION[keyof typeof TOSS_DECISION];
export type InningsStatus = typeof INNINGS_STATUS[keyof typeof INNINGS_STATUS];
export type ResultType = typeof RESULT_TYPE[keyof typeof RESULT_TYPE];
export type WicketType = typeof WICKET_TYPE[keyof typeof WICKET_TYPE];
export type ExtraType = typeof EXTRA_TYPE[keyof typeof EXTRA_TYPE];

// Helper functions for enum validation
export const isValidTeam = (value: string): value is Team => {
  return Object.values(TEAM).includes(value as Team);
};

export const isValidMatchStatus = (value: string): value is MatchStatus => {
  return Object.values(MATCH_STATUS).includes(value as MatchStatus);
};

export const isValidTossDecision = (value: string): value is TossDecision => {
  return Object.values(TOSS_DECISION).includes(value as TossDecision);
};

export const isValidInningsStatus = (value: string): value is InningsStatus => {
  return Object.values(INNINGS_STATUS).includes(value as InningsStatus);
};

export const isValidResultType = (value: string): value is ResultType => {
  return Object.values(RESULT_TYPE).includes(value as ResultType);
};

export const isValidWicketType = (value: string): value is WicketType => {
  return Object.values(WICKET_TYPE).includes(value as WicketType);
};

export const isValidExtraType = (value: string): value is ExtraType => {
  return Object.values(EXTRA_TYPE).includes(value as ExtraType);
};

// Display helpers for UI
export const getTeamDisplay = (team: Team): string => {
  return `Team ${team}`;
};

export const getMatchStatusDisplay = (status: MatchStatus): string => {
  const displayMap = {
    [MATCH_STATUS.CREATED]: "Created",
    [MATCH_STATUS.ACCESS_VERIFIED]: "Access Verified",
    [MATCH_STATUS.PLAYERS_ADDED]: "Players Added",
    [MATCH_STATUS.LIVE]: "Live",
    [MATCH_STATUS.COMPLETED]: "Completed",
  };
  return displayMap[status] || status;
};

export const getTossDecisionDisplay = (decision: TossDecision): string => {
  const displayMap = {
    [TOSS_DECISION.BAT]: "Bat",
    [TOSS_DECISION.BOWL]: "Bowl",
  };
  return displayMap[decision] || decision;
};

export const getInningsStatusDisplay = (status: InningsStatus): string => {
  const displayMap = {
    [INNINGS_STATUS.UPCOMING]: "Upcoming",
    [INNINGS_STATUS.LIVE]: "Live",
    [INNINGS_STATUS.COMPLETED]: "Completed",
  };
  return displayMap[status] || status;
};

export const getResultTypeDisplay = (resultType: ResultType): string => {
  const displayMap = {
    [RESULT_TYPE.RUNS]: "Runs",
    [RESULT_TYPE.WICKETS]: "Wickets",
    [RESULT_TYPE.TIE]: "Tie",
  };
  return displayMap[resultType] || resultType;
};

export const getWicketTypeDisplay = (wicketType: WicketType): string => {
  const displayMap = {
    [WICKET_TYPE.BOWLED]: "Bowled",
    [WICKET_TYPE.CAUGHT]: "Caught",
    [WICKET_TYPE.CAUGHT_AND_BOWLED]: "Caught & Bowled",
    [WICKET_TYPE.RUN_OUT]: "Run Out",
    [WICKET_TYPE.LBW]: "LBW",
    [WICKET_TYPE.STUMPED]: "Stumped",
    [WICKET_TYPE.HIT_WICKET]: "Hit Wicket",
    [WICKET_TYPE.RETIRED_HURT]: "Retired Hurt",
    [WICKET_TYPE.OBSTRUCTING_FIELD]: "Obstructing Field",
    [WICKET_TYPE.HIT_BALL_TWICE]: "Hit Ball Twice",
  };
  return displayMap[wicketType] || wicketType;
};

export const getExtraTypeDisplay = (extraType: ExtraType): string => {
  const displayMap = {
    [EXTRA_TYPE.WIDE]: "Wide",
    [EXTRA_TYPE.NO_BALL]: "No Ball",
    [EXTRA_TYPE.BYES]: "Byes",
    [EXTRA_TYPE.LEG_BYES]: "Leg Byes",
  };
  return displayMap[extraType] || extraType;
};

// Status progression helpers
export const getMatchStatusProgression = (): MatchStatus[] => {
  return [
    MATCH_STATUS.CREATED,
    MATCH_STATUS.ACCESS_VERIFIED,
    MATCH_STATUS.PLAYERS_ADDED,
    MATCH_STATUS.LIVE,
    MATCH_STATUS.COMPLETED,
  ];
};

export const getNextMatchStatus = (currentStatus: MatchStatus): MatchStatus | null => {
  const progression = getMatchStatusProgression();
  const currentIndex = progression.indexOf(currentStatus);
  return currentIndex < progression.length - 1 ? progression[currentIndex + 1] : null;
};

export const isMatchStatusComplete = (status: MatchStatus): boolean => {
  return status === MATCH_STATUS.COMPLETED;
};

export const isMatchStatusLive = (status: MatchStatus): boolean => {
  return status === MATCH_STATUS.LIVE;
};

export const canAccessMatch = (status: MatchStatus): boolean => {
  return status !== MATCH_STATUS.CREATED;
};

export const canAddPlayers = (status: MatchStatus): boolean => {
  return status === MATCH_STATUS.ACCESS_VERIFIED;
};

export const canStartMatch = (status: MatchStatus): boolean => {
  return status === MATCH_STATUS.PLAYERS_ADDED;
};

// Navigation helpers for frontend routing
export const getRouteForMatchStatus = (status: MatchStatus): string => {
  const routeMap = {
    [MATCH_STATUS.CREATED]: "/access-code",
    [MATCH_STATUS.ACCESS_VERIFIED]: "/match-setup",
    [MATCH_STATUS.PLAYERS_ADDED]: "/opening",
    [MATCH_STATUS.LIVE]: "/scoring",
    [MATCH_STATUS.COMPLETED]: "/result",
  };
  return routeMap[status] || "/access-code";
};

// Helper to get full route with matchId for routes that need it
export const getRouteWithMatchId = (status: MatchStatus, matchId: string): string => {
  const baseRoute = getRouteForMatchStatus(status);
  const routesNeedingMatchId = ["/match-setup", "/scoring", "/opening"];
  
  if (routesNeedingMatchId.includes(baseRoute)) {
    return `${baseRoute}/${matchId}`;
  }
  
  return baseRoute;
};
