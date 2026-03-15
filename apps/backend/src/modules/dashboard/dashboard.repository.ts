import { db } from "../../db/client";
import { matches, playerMatchStats, players } from "../../db/schema";
import { eq, sql, desc, asc } from "drizzle-orm";

export type TopPlayerMetric =
  | "mostRuns"
  | "mostWickets"
  | "mostFours"
  | "mostSixes"
  | "mostDotsBowled"
  | "bestStrikeRate"
  | "bestAverage"
  | "bestEconomy";

export type TopPlayerLeader = {
  playerId: string;
  name: string;
  value: number;
};

const baseWhere = (turfId: string) => eq(matches.turfId, turfId);

export const getTopMostRunsRepo = async (turfId: string) => {
  const [row] = await db
    .select({
      playerId: playerMatchStats.playerId,
      name: players.name,
      value: sql<number>`coalesce(sum(${playerMatchStats.runs}), 0)`,
    })
    .from(playerMatchStats)
    .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
    .innerJoin(players, eq(players.id, playerMatchStats.playerId))
    .where(baseWhere(turfId))
    .groupBy(playerMatchStats.playerId, players.name)
    .orderBy(desc(sql`coalesce(sum(${playerMatchStats.runs}), 0)`), asc(players.name))
    .limit(1);

  return row ? { ...row, value: Number(row.value) } : null;
};

export const getTopMostWicketsRepo = async (turfId: string) => {
  const [row] = await db
    .select({
      playerId: playerMatchStats.playerId,
      name: players.name,
      value: sql<number>`coalesce(sum(${playerMatchStats.wickets}), 0)`,
    })
    .from(playerMatchStats)
    .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
    .innerJoin(players, eq(players.id, playerMatchStats.playerId))
    .where(baseWhere(turfId))
    .groupBy(playerMatchStats.playerId, players.name)
    .orderBy(desc(sql`coalesce(sum(${playerMatchStats.wickets}), 0)`), asc(players.name))
    .limit(1);

  return row ? { ...row, value: Number(row.value) } : null;
};

export const getTopMostFoursRepo = async (turfId: string) => {
  const [row] = await db
    .select({
      playerId: playerMatchStats.playerId,
      name: players.name,
      value: sql<number>`coalesce(sum(${playerMatchStats.fours}), 0)`,
    })
    .from(playerMatchStats)
    .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
    .innerJoin(players, eq(players.id, playerMatchStats.playerId))
    .where(baseWhere(turfId))
    .groupBy(playerMatchStats.playerId, players.name)
    .orderBy(desc(sql`coalesce(sum(${playerMatchStats.fours}), 0)`), asc(players.name))
    .limit(1);

  return row ? { ...row, value: Number(row.value) } : null;
};

export const getTopMostSixesRepo = async (turfId: string) => {
  const [row] = await db
    .select({
      playerId: playerMatchStats.playerId,
      name: players.name,
      value: sql<number>`coalesce(sum(${playerMatchStats.sixes}), 0)`,
    })
    .from(playerMatchStats)
    .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
    .innerJoin(players, eq(players.id, playerMatchStats.playerId))
    .where(baseWhere(turfId))
    .groupBy(playerMatchStats.playerId, players.name)
    .orderBy(desc(sql`coalesce(sum(${playerMatchStats.sixes}), 0)`), asc(players.name))
    .limit(1);

  return row ? { ...row, value: Number(row.value) } : null;
};

export const getTopMostDotsBowledRepo = async (turfId: string) => {
  const [row] = await db
    .select({
      playerId: playerMatchStats.playerId,
      name: players.name,
      value: sql<number>`coalesce(sum(${playerMatchStats.dotsBowled}), 0)`,
    })
    .from(playerMatchStats)
    .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
    .innerJoin(players, eq(players.id, playerMatchStats.playerId))
    .where(baseWhere(turfId))
    .groupBy(playerMatchStats.playerId, players.name)
    .orderBy(desc(sql`coalesce(sum(${playerMatchStats.dotsBowled}), 0)`), asc(players.name))
    .limit(1);

  return row ? { ...row, value: Number(row.value) } : null;
};

export const getTopBestStrikeRateRepo = async (turfId: string, minBallsFaced = 30) => {
  const agg: any = db
    .select({
      playerId: playerMatchStats.playerId,
      name: players.name,
      ballsFaced: sql<number>`coalesce(sum(${playerMatchStats.ballsFaced}), 0)`.as(
        "ballsFaced",
      ),
      value:
        sql<number>`case when coalesce(sum(${playerMatchStats.ballsFaced}), 0) > 0 then (coalesce(sum(${playerMatchStats.runs}), 0)::float / coalesce(sum(${playerMatchStats.ballsFaced}), 0)::float) * 100 else 0 end`.as(
          "value",
        ),
    })
    .from(playerMatchStats)
    .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
    .innerJoin(players, eq(players.id, playerMatchStats.playerId))
    .where(baseWhere(turfId))
    .groupBy(playerMatchStats.playerId, players.name)
    .as("agg");

  const [row] = await db
    .select({
      playerId: agg.playerId,
      name: agg.name,
      value: agg.value,
    })
    .from(agg)
    .where(sql`${agg.ballsFaced} >= ${minBallsFaced}`)
    .orderBy(desc(agg.value), asc(agg.name))
    .limit(1);

  return row
    ? { playerId: row.playerId, name: row.name, value: Number(Number(row.value).toFixed(2)) }
    : null;
};

export const getTopBestAverageRepo = async (turfId: string, minInnings = 3) => {
  const agg: any = db
    .select({
      playerId: playerMatchStats.playerId,
      name: players.name,
      inningsBatted:
        sql<number>`sum(case when ${playerMatchStats.ballsFaced} > 0 then 1 else 0 end)`.as(
          "inningsBatted",
        ),
      outs:
        sql<number>`sum(case when ${playerMatchStats.dismissalType} is not null then 1 else 0 end)`.as(
          "outs",
        ),
      value:
        sql<number>`case when sum(case when ${playerMatchStats.dismissalType} is not null then 1 else 0 end) > 0 then (coalesce(sum(${playerMatchStats.runs}), 0)::float / sum(case when ${playerMatchStats.dismissalType} is not null then 1 else 0 end)::float) else 0 end`.as(
          "value",
        ),
    })
    .from(playerMatchStats)
    .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
    .innerJoin(players, eq(players.id, playerMatchStats.playerId))
    .where(baseWhere(turfId))
    .groupBy(playerMatchStats.playerId, players.name)
    .as("agg");

  const [row] = await db
    .select({
      playerId: agg.playerId,
      name: agg.name,
      value: agg.value,
    })
    .from(agg)
    .where(sql`${agg.inningsBatted} >= ${minInnings} and ${agg.outs} > 0`)
    .orderBy(desc(agg.value), asc(agg.name))
    .limit(1);

  return row
    ? { playerId: row.playerId, name: row.name, value: Number(Number(row.value).toFixed(2)) }
    : null;
};

export const getTopBestEconomyRepo = async (turfId: string, minBallsBowled = 12) => {
  const agg: any = db
    .select({
      playerId: playerMatchStats.playerId,
      name: players.name,
      ballsBowled:
        sql<number>`coalesce(sum(${playerMatchStats.ballsBowled}), 0)`.as(
          "ballsBowled",
        ),
      value:
        sql<number>`case when coalesce(sum(${playerMatchStats.ballsBowled}), 0) > 0 then (coalesce(sum(${playerMatchStats.runsConceded}), 0)::float / (coalesce(sum(${playerMatchStats.ballsBowled}), 0)::float / 6.0)) else 0 end`.as(
          "value",
        ),
    })
    .from(playerMatchStats)
    .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
    .innerJoin(players, eq(players.id, playerMatchStats.playerId))
    .where(baseWhere(turfId))
    .groupBy(playerMatchStats.playerId, players.name)
    .as("agg");

  const [row] = await db
    .select({
      playerId: agg.playerId,
      name: agg.name,
      value: agg.value,
    })
    .from(agg)
    .where(sql`${agg.ballsBowled} >= ${minBallsBowled}`)
    .orderBy(asc(agg.value), asc(agg.name))
    .limit(1);

  return row
    ? { playerId: row.playerId, name: row.name, value: Number(Number(row.value).toFixed(2)) }
    : null;
};
