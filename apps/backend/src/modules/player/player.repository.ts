import { db } from "../../db/client";
import { players } from "../../db/schema";
import { eq, and, ilike, sum, count, sql } from "drizzle-orm";
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

export const getPlayersRepo = async (turfId: string, search?: string) => {
  let query = db.select().from(players).where(eq(players.turfId, turfId));

  if (search) {
    query = db
      .select()
      .from(players)
      .where(
        and(eq(players.turfId, turfId), ilike(players.name, `%${search}%`)),
      );
  }

  return query;
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
      oversBowled: sum(playerMatchStats.oversBowled),
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
  const oversIncrement = isLegalDelivery ? 0.1 : 0;
  const wickets = isWicket ? 1 : 0;

  await db.execute(sql`
    UPDATE player_match_stats
    SET
      overs_bowled = overs_bowled + ${oversIncrement},
      runs_conceded = runs_conceded + ${totalRuns},
      wickets = wickets + ${wickets}
    WHERE match_id = ${matchId}
      AND player_id = ${playerId}
  `);
};
