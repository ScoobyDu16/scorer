import { db } from "../../db/client";
import { matches, playerMatchStats, players } from "../../db/schema";
import { eq, sql, desc, asc, and } from "drizzle-orm";

export type LeaderboardMetric =
  | "runs"
  | "wickets"
  | "fours"
  | "sixes"
  | "dotsBowled"
  | "strikeRate"
  | "average"
  | "economy"
  | "highestScore"
  | "most100s"
  | "most50s"
  | "bestBowlingAverage"
  | "bestBowlingFigures"
  | "most3WicketHauls"
  | "most5WicketHauls"
  | "bestBowlingStrikeRate";

export type LeaderboardRow = {
  playerId: string;
  name: string;
  value: number;
  meta?: Record<string, number>;
};

export type LeaderboardResult = {
  metric: LeaderboardMetric;
  rows: LeaderboardRow[];
  pagination: {
    page: number;
    limit: number;
    hasNext: boolean;
  };
};

const clampLimit = (limit: number) => Math.max(1, Math.min(50, limit));

export const getLeaderboardRepo = async (params: {
  turfId: string;
  metric: LeaderboardMetric;
  page: number;
  limit: number;
}) => {
  const page = Math.max(1, params.page);
  const limit = clampLimit(params.limit);
  const offset = (page - 1) * limit;

  const withMetric = (() => {
    switch (params.metric) {
      case "runs":
        {
          const agg = db
            .select({
              playerId: playerMatchStats.playerId,
              name: players.name,
              value: sql<number>`coalesce(sum(${playerMatchStats.runs}), 0)`.as(
                "value",
              ),
            })
            .from(playerMatchStats)
            .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
            .innerJoin(players, eq(players.id, playerMatchStats.playerId))
            .where(eq(matches.turfId, params.turfId))
            .groupBy(playerMatchStats.playerId, players.name)
            .as("agg");

          return db
            .select({
              playerId: agg.playerId,
              name: agg.name,
              value: agg.value,
            })
            .from(agg)
            .where(sql`${agg.value} > 0`)
            .orderBy(desc(agg.value), asc(agg.name));
        }

      case "wickets":
        {
          const agg = db
            .select({
              playerId: playerMatchStats.playerId,
              name: players.name,
              value:
                sql<number>`coalesce(sum(${playerMatchStats.wickets}), 0)`.as(
                  "value",
                ),
            })
            .from(playerMatchStats)
            .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
            .innerJoin(players, eq(players.id, playerMatchStats.playerId))
            .where(eq(matches.turfId, params.turfId))
            .groupBy(playerMatchStats.playerId, players.name)
            .as("agg");

          return db
            .select({
              playerId: agg.playerId,
              name: agg.name,
              value: agg.value,
            })
            .from(agg)
            .where(sql`${agg.value} > 0`)
            .orderBy(desc(agg.value), asc(agg.name));
        }

      case "fours":
        {
          const agg = db
            .select({
              playerId: playerMatchStats.playerId,
              name: players.name,
              value:
                sql<number>`coalesce(sum(${playerMatchStats.fours}), 0)`.as(
                  "value",
                ),
            })
            .from(playerMatchStats)
            .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
            .innerJoin(players, eq(players.id, playerMatchStats.playerId))
            .where(eq(matches.turfId, params.turfId))
            .groupBy(playerMatchStats.playerId, players.name)
            .as("agg");

          return db
            .select({
              playerId: agg.playerId,
              name: agg.name,
              value: agg.value,
            })
            .from(agg)
            .where(sql`${agg.value} > 0`)
            .orderBy(desc(agg.value), asc(agg.name));
        }

      case "sixes":
        {
          const agg = db
            .select({
              playerId: playerMatchStats.playerId,
              name: players.name,
              value:
                sql<number>`coalesce(sum(${playerMatchStats.sixes}), 0)`.as(
                  "value",
                ),
            })
            .from(playerMatchStats)
            .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
            .innerJoin(players, eq(players.id, playerMatchStats.playerId))
            .where(eq(matches.turfId, params.turfId))
            .groupBy(playerMatchStats.playerId, players.name)
            .as("agg");

          return db
            .select({
              playerId: agg.playerId,
              name: agg.name,
              value: agg.value,
            })
            .from(agg)
            .where(sql`${agg.value} > 0`)
            .orderBy(desc(agg.value), asc(agg.name));
        }

      case "dotsBowled":
        {
          const agg = db
            .select({
              playerId: playerMatchStats.playerId,
              name: players.name,
              value:
                sql<number>`coalesce(sum(${playerMatchStats.dotsBowled}), 0)`.as(
                  "value",
                ),
            })
            .from(playerMatchStats)
            .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
            .innerJoin(players, eq(players.id, playerMatchStats.playerId))
            .where(eq(matches.turfId, params.turfId))
            .groupBy(playerMatchStats.playerId, players.name)
            .as("agg");

          return db
            .select({
              playerId: agg.playerId,
              name: agg.name,
              value: agg.value,
            })
            .from(agg)
            .where(sql`${agg.value} > 0`)
            .orderBy(desc(agg.value), asc(agg.name));
        }

      case "strikeRate": {
        const minBallsFaced = 30;
        const agg = db
          .select({
            playerId: playerMatchStats.playerId,
            name: players.name,
            value:
              sql<number>`case when coalesce(sum(${playerMatchStats.ballsFaced}), 0) > 0 then (coalesce(sum(${playerMatchStats.runs}), 0)::float / coalesce(sum(${playerMatchStats.ballsFaced}), 0)::float) * 100 else 0 end`.as(
                "value",
              ),
            ballsFaced:
              sql<number>`coalesce(sum(${playerMatchStats.ballsFaced}), 0)`.as(
                "ballsFaced",
              ),
          })
          .from(playerMatchStats)
          .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
          .innerJoin(players, eq(players.id, playerMatchStats.playerId))
          .where(eq(matches.turfId, params.turfId))
          .groupBy(playerMatchStats.playerId, players.name)
          .as("agg");

        return db
          .select({
            playerId: agg.playerId,
            name: agg.name,
            value: agg.value,
            ballsFaced: agg.ballsFaced,
          })
          .from(agg)
          .where(sql`${agg.ballsFaced} >= ${minBallsFaced} and ${agg.value} > 0`)
          .orderBy(desc(agg.value), asc(agg.name));
      }

      case "average": {
        const minInnings = 3;
        const agg = db
          .select({
            playerId: playerMatchStats.playerId,
            name: players.name,
            value:
              sql<number>`case when sum(case when ${playerMatchStats.dismissalType} is not null then 1 else 0 end) > 0 then (coalesce(sum(${playerMatchStats.runs}), 0)::float / sum(case when ${playerMatchStats.dismissalType} is not null then 1 else 0 end)::float) else 0 end`.as(
                "value",
              ),
            inningsBatted:
              sql<number>`sum(case when ${playerMatchStats.ballsFaced} > 0 then 1 else 0 end)`.as(
                "inningsBatted",
              ),
            outs: sql<number>`sum(case when ${playerMatchStats.dismissalType} is not null then 1 else 0 end)`.as(
              "outs",
            ),
          })
          .from(playerMatchStats)
          .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
          .innerJoin(players, eq(players.id, playerMatchStats.playerId))
          .where(eq(matches.turfId, params.turfId))
          .groupBy(playerMatchStats.playerId, players.name)
          .as("agg");

        return db
          .select({
            playerId: agg.playerId,
            name: agg.name,
            value: agg.value,
            inningsBatted: agg.inningsBatted,
            outs: agg.outs,
          })
          .from(agg)
          .where(sql`${agg.inningsBatted} >= ${minInnings} and ${agg.value} > 0`)
          .orderBy(desc(agg.value), asc(agg.name));
      }

      case "economy": {
        const minBallsBowled = 12;
        const agg = db
          .select({
            playerId: playerMatchStats.playerId,
            name: players.name,
            value:
              sql<number>`case when coalesce(sum(${playerMatchStats.ballsBowled}), 0) > 0 then (coalesce(sum(${playerMatchStats.runsConceded}), 0)::float / (coalesce(sum(${playerMatchStats.ballsBowled}), 0)::float / 6.0)) else 0 end`.as(
                "value",
              ),
            ballsBowled:
              sql<number>`coalesce(sum(${playerMatchStats.ballsBowled}), 0)`.as(
                "ballsBowled",
              ),
          })
          .from(playerMatchStats)
          .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
          .innerJoin(players, eq(players.id, playerMatchStats.playerId))
          .where(eq(matches.turfId, params.turfId))
          .groupBy(playerMatchStats.playerId, players.name)
          .as("agg");

        return db
          .select({
            playerId: agg.playerId,
            name: agg.name,
            value: agg.value,
            ballsBowled: agg.ballsBowled,
          })
          .from(agg)
          .where(sql`${agg.ballsBowled} >= ${minBallsBowled} and ${agg.value} > 0`)
          .orderBy(asc(agg.value), asc(agg.name));
      }

      case "highestScore": {
        const agg = db
          .select({
            playerId: playerMatchStats.playerId,
            name: players.name,
            value: sql<number>`coalesce(max(${playerMatchStats.runs}), 0)`.as(
              "value",
            ),
          })
          .from(playerMatchStats)
          .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
          .innerJoin(players, eq(players.id, playerMatchStats.playerId))
          .where(eq(matches.turfId, params.turfId))
          .groupBy(playerMatchStats.playerId, players.name)
          .as("agg");

        return db
          .select({
            playerId: agg.playerId,
            name: agg.name,
            value: agg.value,
          })
          .from(agg)
          .where(sql`${agg.value} > 0`)
          .orderBy(desc(agg.value), asc(agg.name));
      }

      case "most100s": {
        const agg = db
          .select({
            playerId: playerMatchStats.playerId,
            name: players.name,
            value: sql<number>`coalesce(sum(case when ${playerMatchStats.runs} >= 100 then 1 else 0 end), 0)`.as(
              "value",
            ),
          })
          .from(playerMatchStats)
          .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
          .innerJoin(players, eq(players.id, playerMatchStats.playerId))
          .where(eq(matches.turfId, params.turfId))
          .groupBy(playerMatchStats.playerId, players.name)
          .as("agg");

        return db
          .select({
            playerId: agg.playerId,
            name: agg.name,
            value: agg.value,
          })
          .from(agg)
          .where(sql`${agg.value} > 0`)
          .orderBy(desc(agg.value), asc(agg.name));
      }

      case "most50s": {
        const agg = db
          .select({
            playerId: playerMatchStats.playerId,
            name: players.name,
            value: sql<number>`coalesce(sum(case when ${playerMatchStats.runs} >= 50 and ${playerMatchStats.runs} < 100 then 1 else 0 end), 0)`.as(
              "value",
            ),
          })
          .from(playerMatchStats)
          .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
          .innerJoin(players, eq(players.id, playerMatchStats.playerId))
          .where(eq(matches.turfId, params.turfId))
          .groupBy(playerMatchStats.playerId, players.name)
          .as("agg");

        return db
          .select({
            playerId: agg.playerId,
            name: agg.name,
            value: agg.value,
          })
          .from(agg)
          .where(sql`${agg.value} > 0`)
          .orderBy(desc(agg.value), asc(agg.name));
      }

      case "bestBowlingAverage": {
        const minBallsBowled = 12;
        const agg = db
          .select({
            playerId: playerMatchStats.playerId,
            name: players.name,
            value:
              sql<number>`case when coalesce(sum(${playerMatchStats.wickets}), 0) > 0 then (coalesce(sum(${playerMatchStats.runsConceded}), 0)::float / coalesce(sum(${playerMatchStats.wickets}), 0)::float) else 0 end`.as(
                "value",
              ),
            ballsBowled:
              sql<number>`coalesce(sum(${playerMatchStats.ballsBowled}), 0)`.as(
                "ballsBowled",
              ),
          })
          .from(playerMatchStats)
          .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
          .innerJoin(players, eq(players.id, playerMatchStats.playerId))
          .where(eq(matches.turfId, params.turfId))
          .groupBy(playerMatchStats.playerId, players.name)
          .as("agg");

        return db
          .select({
            playerId: agg.playerId,
            name: agg.name,
            value: agg.value,
            ballsBowled: agg.ballsBowled,
          })
          .from(agg)
          .where(sql`${agg.ballsBowled} >= ${minBallsBowled} and ${agg.value} > 0`)
          .orderBy(asc(agg.value), asc(agg.name));
      }

      case "bestBowlingFigures": {
        return db
          .select({
            playerId: playerMatchStats.playerId,
            name: players.name,
            value: sql<number>`coalesce(${playerMatchStats.wickets}, 0)`.as("value"),
            wickets: sql<number>`coalesce(${playerMatchStats.wickets}, 0)`.as("wickets"),
            runsConceded: sql<number>`coalesce(${playerMatchStats.runsConceded}, 0)`.as("runsConceded"),
            matchId: playerMatchStats.matchId,
          })
          .from(playerMatchStats)
          .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
          .innerJoin(players, eq(players.id, playerMatchStats.playerId))
          .where(and(
            eq(matches.turfId, params.turfId),
            sql`${playerMatchStats.wickets} > 0`
          ))
          .orderBy(desc(sql`${playerMatchStats.wickets}`), asc(sql`${playerMatchStats.runsConceded}`), asc(players.name));
      }

      case "most3WicketHauls": {
        const agg = db
          .select({
            playerId: playerMatchStats.playerId,
            name: players.name,
            value: sql<number>`coalesce(sum(case when ${playerMatchStats.wickets} >= 3 then 1 else 0 end), 0)`.as(
              "value",
            ),
          })
          .from(playerMatchStats)
          .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
          .innerJoin(players, eq(players.id, playerMatchStats.playerId))
          .where(eq(matches.turfId, params.turfId))
          .groupBy(playerMatchStats.playerId, players.name)
          .as("agg");

        return db
          .select({
            playerId: agg.playerId,
            name: agg.name,
            value: agg.value,
          })
          .from(agg)
          .where(sql`${agg.value} > 0`)
          .orderBy(desc(agg.value), asc(agg.name));
      }

      case "most5WicketHauls": {
        const agg = db
          .select({
            playerId: playerMatchStats.playerId,
            name: players.name,
            value: sql<number>`coalesce(sum(case when ${playerMatchStats.wickets} >= 5 then 1 else 0 end), 0)`.as(
              "value",
            ),
          })
          .from(playerMatchStats)
          .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
          .innerJoin(players, eq(players.id, playerMatchStats.playerId))
          .where(eq(matches.turfId, params.turfId))
          .groupBy(playerMatchStats.playerId, players.name)
          .as("agg");

        return db
          .select({
            playerId: agg.playerId,
            name: agg.name,
            value: agg.value,
          })
          .from(agg)
          .where(sql`${agg.value} > 0`)
          .orderBy(desc(agg.value), asc(agg.name));
      }

      case "bestBowlingStrikeRate": {
        const minBallsBowled = 12;
        const agg = db
          .select({
            playerId: playerMatchStats.playerId,
            name: players.name,
            value:
              sql<number>`case when coalesce(sum(${playerMatchStats.wickets}), 0) > 0 then (coalesce(sum(${playerMatchStats.ballsBowled}), 0)::float / coalesce(sum(${playerMatchStats.wickets}), 0)::float) else 0 end`.as(
                "value",
              ),
            ballsBowled:
              sql<number>`coalesce(sum(${playerMatchStats.ballsBowled}), 0)`.as(
                "ballsBowled",
              ),
          })
          .from(playerMatchStats)
          .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
          .innerJoin(players, eq(players.id, playerMatchStats.playerId))
          .where(eq(matches.turfId, params.turfId))
          .groupBy(playerMatchStats.playerId, players.name)
          .as("agg");

        return db
          .select({
            playerId: agg.playerId,
            name: agg.name,
            value: agg.value,
            ballsBowled: agg.ballsBowled,
          })
          .from(agg)
          .where(sql`${agg.ballsBowled} >= ${minBallsBowled} and ${agg.value} > 0`)
          .orderBy(asc(agg.value), asc(agg.name));
      }

      default:
        return db
          .select({
            playerId: playerMatchStats.playerId,
            name: players.name,
            value: sql<number>`0`,
          })
          .from(playerMatchStats)
          .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
          .innerJoin(players, eq(players.id, playerMatchStats.playerId))
          .where(eq(matches.turfId, params.turfId))
          .groupBy(playerMatchStats.playerId, players.name)
          .orderBy(asc(players.name));
    }
  })();

  const rowsPlusOne = await withMetric.limit(limit + 1).offset(offset);
  const hasNext = rowsPlusOne.length > limit;
  const rows = rowsPlusOne.slice(0, limit).map((r: any) => {
    const meta: Record<string, number> = {};
    if (typeof r.ballsFaced !== "undefined")
      meta.ballsFaced = Number(r.ballsFaced);
    if (typeof r.inningsBatted !== "undefined")
      meta.inningsBatted = Number(r.inningsBatted);
    if (typeof r.outs !== "undefined") meta.outs = Number(r.outs);
    if (typeof r.ballsBowled !== "undefined")
      meta.ballsBowled = Number(r.ballsBowled);
    if (typeof r.wickets !== "undefined") meta.wickets = Number(r.wickets);
    if (typeof r.runsConceded !== "undefined")
      meta.runsConceded = Number(r.runsConceded);
    if (typeof r.matchId !== "undefined") meta.matchId = Number(r.matchId);

    return {
      playerId: r.playerId,
      name: r.name,
      value: Number(Number(r.value).toFixed(2)),
      meta: Object.keys(meta).length ? meta : undefined,
    } satisfies LeaderboardRow;
  });

  return {
    metric: params.metric,
    rows,
    pagination: {
      page,
      limit,
      hasNext,
    },
  } satisfies LeaderboardResult;
};
