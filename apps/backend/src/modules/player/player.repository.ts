import { db } from "../../db/client";
import { players } from "../../db/schema";
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
      fours: sum(playerMatchStats.fours),
      sixes: sum(playerMatchStats.sixes),
      wickets: sum(playerMatchStats.wickets),
      ballsBowled: sum(playerMatchStats.ballsBowled),
      runsConceded: sum(playerMatchStats.runsConceded),
    })
    .from(playerMatchStats)
    .where(eq(playerMatchStats.playerId, playerId));

  return result[0];
};

export const upsertPlayerMatchStatsRepo = async (
  matchId: string,
  playerId: string,
  team: "A" | "B",
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
      })
      .returning();

    return created;
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

  await db.execute(sql`
    UPDATE player_match_stats
    SET
      runs = runs + ${runs},
      balls_faced = balls_faced + ${ballsIncrement},
      fours = fours + ${fours},
      sixes = sixes + ${sixes}
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

  await db.execute(sql`
    UPDATE player_match_stats
    SET
      balls_bowled = balls_bowled + ${ballsIncrement},
      runs_conceded = runs_conceded + ${totalRuns},
      wickets = wickets + ${wickets}
    WHERE match_id = ${matchId}
      AND player_id = ${playerId}
  `);
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
