import { db } from "../../db/client";
import { players, matchPlayers, matches } from "../../db/schema";
import {
  eq,
  and,
  ilike,
  sum,
  count,
  sql,
  inArray,
  desc,
  asc,
  or,
  max,
  isNotNull,
  isNull,
} from "drizzle-orm";
import { playerMatchStats } from "../../db/schema";

export const createPlayerRepo = async (data: any) => {
  const [player] = await db.insert(players).values(data).returning();
  return player;
};

export const findPlayerByUniqueFields = async (
  turfId: string,
  name: string,
  phone?: string,
) => {
  const conditions = [eq(players.turfId, turfId), eq(players.name, name)];

  if (phone) {
    conditions.push(eq(players.phone, phone));
  }

  const [player] = await db
    .select()
    .from(players)
    .where(and(...conditions));

  return player;
};

export const getPlayersRepo = async (
  turfId: string,
  search?: string,
  page = 1,
  limit = 20,
  sortBy = "name",
  sortOrder: "asc" | "desc" = "asc",
) => {
  const offset = (page - 1) * limit;

  /**
   * 1️⃣ Build conditions array
   */
  const conditions = [eq(players.turfId, turfId)];

  if (search) {
    conditions.push(
      or(
        ilike(players.name, `%${search}%`),
        ilike(players.phone, `%${search}%`),
        ilike(players.email, `%${search}%`),
      )!,
    );
  }

  const whereCondition = and(...conditions);

  /**
   * 2️⃣ Sorting
   */
  const sortColumn = sortBy === "name" ? players.name : players.createdAt;

  const sortDirection =
    sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  /**
   * 3️⃣ Count query
   */
  const [totalCountResult] = await db
    .select({ count: count() })
    .from(players)
    .where(whereCondition);

  const total = totalCountResult?.count || 0;

  /**
   * 4️⃣ Data query
   */
  const playersList = await db
    .select()
    .from(players)
    .where(whereCondition)
    .orderBy(sortDirection)
    .limit(limit)
    .offset(offset);

  return {
    players: playersList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

export const getPlayerCareerStatsRepo = async (playerId: string) => {
  const result = await db
    .select({
      matches: count(playerMatchStats.matchId),
      runs: sum(playerMatchStats.runs),
      ballsFaced: sum(playerMatchStats.ballsFaced),
      dotsFaced: sum(playerMatchStats.dotsFaced),
      fours: sum(playerMatchStats.fours),
      sixes: sum(playerMatchStats.sixes),
      wickets: sum(playerMatchStats.wickets),
      ballsBowled: sum(playerMatchStats.ballsBowled),
      dotsBowled: sum(playerMatchStats.dotsBowled),
      maidens: sum(playerMatchStats.maidens),
      runsConceded: sum(playerMatchStats.runsConceded),
    })
    .from(playerMatchStats)
    .where(eq(playerMatchStats.playerId, playerId));

  return result[0];
};

export const getPlayerCareerBattingAggRepo = async (
  turfId: string,
  playerId: string,
) => {
  const result = await db
    .select({
      matches: sql<number>`count(distinct ${playerMatchStats.matchId})`,
      inningsBatted:
        sql<number>`sum(case when ${playerMatchStats.ballsFaced} > 0 then 1 else 0 end)`,
      outs:
        sql<number>`sum(case when ${playerMatchStats.dismissalType} is not null then 1 else 0 end)`,
      runs: sql<number>`coalesce(sum(${playerMatchStats.runs}), 0)`,
      highestScore: sql<number>`coalesce(max(${playerMatchStats.runs}), 0)`,
      ballsFaced: sql<number>`coalesce(sum(${playerMatchStats.ballsFaced}), 0)`,
      fours: sql<number>`coalesce(sum(${playerMatchStats.fours}), 0)`,
      sixes: sql<number>`coalesce(sum(${playerMatchStats.sixes}), 0)`,
      ducks:
        sql<number>`sum(case when ${playerMatchStats.ballsFaced} > 0 and ${playerMatchStats.runs} = 0 then 1 else 0 end)`,
      strikeRate:
        sql<number>`case when coalesce(sum(${playerMatchStats.ballsFaced}), 0) > 0 then (coalesce(sum(${playerMatchStats.runs}), 0)::float / coalesce(sum(${playerMatchStats.ballsFaced}), 0)::float) * 100 else 0 end`,
    })
    .from(playerMatchStats)
    .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
    .where(and(eq(matches.turfId, turfId), eq(playerMatchStats.playerId, playerId)));

  return result[0];
};

export const getPlayerCareerBowlingAggRepo = async (
  turfId: string,
  playerId: string,
) => {
  const result = await db
    .select({
      inningsBowled:
        sql<number>`sum(case when ${playerMatchStats.ballsBowled} > 0 then 1 else 0 end)`,
      ballsBowled: sql<number>`coalesce(sum(${playerMatchStats.ballsBowled}), 0)`,
      dotsBowled: sql<number>`coalesce(sum(${playerMatchStats.dotsBowled}), 0)`,
      maidens: sql<number>`coalesce(sum(${playerMatchStats.maidens}), 0)`,
      runsConceded: sql<number>`coalesce(sum(${playerMatchStats.runsConceded}), 0)`,
      wickets: sql<number>`coalesce(sum(${playerMatchStats.wickets}), 0)`,
      economy:
        sql<number>`case when coalesce(sum(${playerMatchStats.ballsBowled}), 0) > 0 then (coalesce(sum(${playerMatchStats.runsConceded}), 0)::float / coalesce(sum(${playerMatchStats.ballsBowled}), 0)::float) * 6 else 0 end`,
      strikeRate:
        sql<number>`case when coalesce(sum(${playerMatchStats.wickets}), 0) > 0 then (coalesce(sum(${playerMatchStats.ballsBowled}), 0)::float / coalesce(sum(${playerMatchStats.wickets}), 0)::float) else 0 end`,
      average:
        sql<number>`case when coalesce(sum(${playerMatchStats.wickets}), 0) > 0 then (coalesce(sum(${playerMatchStats.runsConceded}), 0)::float / coalesce(sum(${playerMatchStats.wickets}), 0)::float) else 0 end`,
    })
    .from(playerMatchStats)
    .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
    .where(and(eq(matches.turfId, turfId), eq(playerMatchStats.playerId, playerId)));

  return result[0];
};

export const getPlayerBestBowlingInningsRepo = async (
  turfId: string,
  playerId: string,
) => {
  const result = await db
    .select({
      wickets: playerMatchStats.wickets,
      runsConceded: playerMatchStats.runsConceded,
    })
    .from(playerMatchStats)
    .innerJoin(matches, eq(matches.id, playerMatchStats.matchId))
    .where(
      and(
        eq(matches.turfId, turfId),
        eq(playerMatchStats.playerId, playerId),
        sql`${playerMatchStats.ballsBowled} > 0`,
      ),
    )
    .orderBy(desc(playerMatchStats.wickets), asc(playerMatchStats.runsConceded))
    .limit(1);

  return result[0] || null;
};

export const getNextBattingOrderRepo = async (
  matchId: string,
  team: "A" | "B",
) => {
  const result = await db
    .select({ maxOrder: max(playerMatchStats.battingOrder) })
    .from(playerMatchStats)
    .where(
      and(
        eq(playerMatchStats.matchId, matchId),
        eq(playerMatchStats.team, team),
        isNotNull(playerMatchStats.battingOrder),
      ),
    );

  return result[0]?.maxOrder || 0;
};

export const getPlayersYetToBatRepo = async (
  matchId: string,
  team: "A" | "B",
) => {
  const result = await db
    .select({
      id: players.id,
      name: players.name,
      email: players.email,
      phone: players.phone,
    })
    .from(matchPlayers)
    .innerJoin(players, eq(players.id, matchPlayers.playerId))
    .leftJoin(
      playerMatchStats,
      and(
        eq(playerMatchStats.playerId, matchPlayers.playerId),
        eq(playerMatchStats.matchId, matchId),
        eq(playerMatchStats.team, team),
      ),
    )
    .where(
      and(
        eq(matchPlayers.matchId, matchId),
        eq(matchPlayers.team, team),
        isNull(playerMatchStats.battingOrder), // yet to bat
      ),
    )
    .orderBy(asc(players.name));

  return result;
};

export const upsertPlayerMatchStatsRepo = async (
  matchId: string,
  playerId: string,
  team: "A" | "B",
  battingOrder?: number,
) => {
  const [record] = await db
    .select()
    .from(playerMatchStats)
    .where(
      and(
        eq(playerMatchStats.matchId, matchId),
        eq(playerMatchStats.playerId, playerId),
      ),
    );

  if (!record) {
    const [created] = await db
      .insert(playerMatchStats)
      .values({
        matchId,
        playerId,
        team,
        battingOrder,
      })
      .returning();

    return created;
  }

  // If battingOrder is provided, update it
  if (battingOrder !== undefined) {
    const [updated] = await db
      .update(playerMatchStats)
      .set({ battingOrder })
      .where(eq(playerMatchStats.id, record.id))
      .returning();

    return updated;
  }

  return record;
};

/**
 * Update batting stats
 */
export const updateBattingStatsRepo = async (
  matchId: string,
  playerId: string,
  runs: number,
  isLegalDelivery: boolean,
) => {
  const ballsIncrement = isLegalDelivery ? 1 : 0;
  const fours = runs === 4 ? 1 : 0;
  const sixes = runs === 6 ? 1 : 0;
  const dots = isLegalDelivery && runs === 0 ? 1 : 0;

  await db.execute(sql`
    UPDATE player_match_stats
    SET
      runs = runs + ${runs},
      balls_faced = balls_faced + ${ballsIncrement},
      dots_faced = dots_faced + ${dots},
      fours = fours + ${fours},
      sixes = sixes + ${sixes}
    WHERE match_id = ${matchId}
      AND player_id = ${playerId}
  `);
};

export const setDismissalTypeRepo = async (
  matchId: string,
  playerId: string,
  dismissalType: string,
) => {
  await db.execute(sql`
    UPDATE player_match_stats
    SET dismissal_type = ${dismissalType}
    WHERE match_id = ${matchId}
      AND player_id = ${playerId}
  `);
};

export const clearDismissalTypeRepo = async (matchId: string, playerId: string) => {
  await db.execute(sql`
    UPDATE player_match_stats
    SET dismissal_type = NULL
    WHERE match_id = ${matchId}
      AND player_id = ${playerId}
  `);
};

/**
 * Update bowling stats
 */
export const updateBowlingStatsRepo = async (
  matchId: string,
  playerId: string,
  totalRuns: number,
  isWicket: boolean,
  isLegalDelivery: boolean,
) => {
  const ballsIncrement = isLegalDelivery ? 1 : 0;
  const wickets = isWicket ? 1 : 0;
  const dots = isLegalDelivery && totalRuns === 0 ? 1 : 0;

  await db.execute(sql`
    UPDATE player_match_stats
    SET
      balls_bowled = balls_bowled + ${ballsIncrement},
      dots_bowled = dots_bowled + ${dots},
      runs_conceded = runs_conceded + ${totalRuns},
      wickets = wickets + ${wickets}
    WHERE match_id = ${matchId}
      AND player_id = ${playerId}
  `);
};

/**
 * Revert batting stats (for undo operations)
 */
export const revertBattingStatsRepo = async (
  matchId: string,
  playerId: string,
  runs: number,
  isLegalDelivery: boolean,
) => {
  const ballsDecrement = isLegalDelivery ? 1 : 0;
  const fours = runs === 4 ? 1 : 0;
  const sixes = runs === 6 ? 1 : 0;
  const dots = isLegalDelivery && runs === 0 ? 1 : 0;

  await db.execute(sql`
    UPDATE player_match_stats
    SET
      runs = GREATEST(0, runs - ${runs}),
      balls_faced = GREATEST(0, balls_faced - ${ballsDecrement}),
      dots_faced = GREATEST(0, dots_faced - ${dots}),
      fours = GREATEST(0, fours - ${fours}),
      sixes = GREATEST(0, sixes - ${sixes})
    WHERE match_id = ${matchId}
      AND player_id = ${playerId}
  `);
};

/**
 * Revert bowling stats (for undo operations)
 */
export const revertBowlingStatsRepo = async (
  matchId: string,
  playerId: string,
  totalRuns: number,
  isWicket: boolean,
  isLegalDelivery: boolean,
) => {
  const ballsDecrement = isLegalDelivery ? 1 : 0;
  const wickets = isWicket ? 1 : 0;
  const dots = isLegalDelivery && totalRuns === 0 ? 1 : 0;

  await db.execute(sql`
    UPDATE player_match_stats
    SET
      balls_bowled = GREATEST(0, balls_bowled - ${ballsDecrement}),
      dots_bowled = GREATEST(0, dots_bowled - ${dots}),
      runs_conceded = GREATEST(0, runs_conceded - ${totalRuns}),
      wickets = GREATEST(0, wickets - ${wickets})
    WHERE match_id = ${matchId}
      AND player_id = ${playerId}
  `);
};

/**
 * Update maidens for bowler (call at end of each over)
 */
export const updateMaidensRepo = async (matchId: string, playerId: string) => {
  // Get current bowler stats
  const [currentStats] = await db
    .select()
    .from(playerMatchStats)
    .where(
      and(
        eq(playerMatchStats.matchId, matchId),
        eq(playerMatchStats.playerId, playerId),
      ),
    );

  if (!currentStats) return;

  // Calculate runs conceded in current over (last 6 legal balls)
  const ballsInCurrentOver = currentStats.ballsBowled % 6;

  // If just completed an over (6 balls) and runs in this over were 0, increment maidens
  if (ballsInCurrentOver === 0) {
    // Get runs in the last over by checking recent balls
    const recentBalls = await db
      .select({
        runs: sql`runs + extra_runs`,
        isLegal: sql`is_legal_delivery`,
      })
      .from(sql`balls`)
      .where(
        and(
          sql`match_id = ${matchId}`,
          sql`bowler_id = ${playerId}`,
          sql`is_legal_delivery = true`,
        ),
      )
      .orderBy(sql`created_at DESC`)
      .limit(6);

    const runsInOver = recentBalls.reduce(
      (sum: number, ball: any) => sum + (ball.runs || 0),
      0,
    );

    if (runsInOver === 0) {
      await db.execute(sql`
        UPDATE player_match_stats
        SET maidens = maidens + 1
        WHERE match_id = ${matchId}
          AND player_id = ${playerId}
      `);
    }
  }
};

export const getMatchPlayerStatsRepo = async (matchId: string) => {
  return db
    .select()
    .from(playerMatchStats)
    .where(eq(playerMatchStats.matchId, matchId));
};

export const getPlayerByIdRepo = async (playerId: string) => {
  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.id, playerId));

  return player;
};

export const getPlayersByIdsRepo = async (ids: string[]) => {
  if (!ids.length) return [];

  return db.select().from(players).where(inArray(players.id, ids));
};

export const updatePlayerRepo = async (playerId: string, data: any) => {
  const [player] = await db
    .update(players)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(players.id, playerId))
    .returning();
  return player;
};

export const deletePlayerRepo = async (playerId: string) => {
  await db.delete(players).where(eq(players.id, playerId));
};
