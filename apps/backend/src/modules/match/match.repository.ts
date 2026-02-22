import { balls } from "../../db/schema";
import { sql, desc, eq, and } from "drizzle-orm";

import { db } from "../../db/client";
import { innings, matches, matchPlayers, players } from "../../db/schema";

export const createMatchRepo = async (data: any) => {
  const [match] = await db.insert(matches).values(data).returning();
  return match;
};

export const addMatchPlayersRepo = async (data: any[]) => {
  return db.insert(matchPlayers).values(data).returning();
};

export const getMatchPlayersRepo = async (matchId: string) => {
  return db
    .select({
      playerId: matchPlayers.playerId,
      team: matchPlayers.team,
      player: {
        id: players.id,
        name: players.name,
        email: players.email,
        phone: players.phone,
      },
    })
    .from(matchPlayers)
    .leftJoin(players, eq(matchPlayers.playerId, players.id))
    .where(eq(matchPlayers.matchId, matchId));
};

export const getMatchByIdRepo = async (matchId: string) => {
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId));

  return match;
};

export const updateMatchRepo = async (matchId: string, data: any) => {
  const [match] = await db
    .update(matches)
    .set(data)
    .where(eq(matches.id, matchId))
    .returning();

  return match;
};

export const createInningsRepo = async (data: any) => {
  const [record] = await db.insert(innings).values(data).returning();
  return record;
};

export const createBallRepo = async (data: any) => {
  const [ball] = await db.insert(balls).values(data).returning();
  return ball;
};

export const updateInningsTotalsRepo = async (
  inningsId: string,
  runsToAdd: number,
  isWicket: boolean,
  isLegalDelivery: boolean,
) => {
  const ballsIncrement = isLegalDelivery ? 1 : 0;
  const wicketIncrement = isWicket ? 1 : 0;

  await db.execute(sql`
    UPDATE innings
    SET
      total_runs = total_runs + ${runsToAdd},
      total_wickets = total_wickets + ${wicketIncrement},
      total_balls = total_balls + ${ballsIncrement},
      updated_at = NOW()
    WHERE id = ${inningsId}
  `);
};

export const getLastBallRepo = async (matchId: string) => {
  const [ball] = await db
    .select()
    .from(balls)
    .where(eq(balls.matchId, matchId))
    .orderBy(desc(balls.overNumber), desc(balls.ballNumber))
    .limit(1);

  return ball;
};

export const deleteBallRepo = async (ballId: string) => {
  await db.delete(balls).where(eq(balls.id, ballId));
};

export const revertInningsTotalsRepo = async (
  inningsId: string,
  runsToSubtract: number,
  isWicket: boolean,
  isLegalDelivery: boolean,
) => {
  const ballsDecrement = isLegalDelivery ? 1 : 0;
  const wicketDecrement = isWicket ? 1 : 0;

  await db.execute(sql`
    UPDATE innings
    SET
      total_runs = total_runs - ${runsToSubtract},
      total_wickets = total_wickets - ${wicketDecrement},
      total_balls = total_balls - ${ballsDecrement},
      updated_at = NOW()
    WHERE id = ${inningsId}
  `);
};

export const getCurrentInningsRepo = async (
  matchId: string,
  inningsNumber: number,
) => {
  const [record] = await db
    .select()
    .from(innings)
    .where(
      and(
        eq(innings.matchId, matchId),
        eq(innings.inningsNumber, inningsNumber),
      ),
    );

  return record;
};

export const getInningsByIdRepo = async (inningsId: string) => {
  const [record] = await db
    .select()
    .from(innings)
    .where(eq(innings.id, inningsId));

  return record;
};

export const updateInningsStatusRepo = async (
  inningsId: string,
  status: "COMPLETED",
) => {
  await db
    .update(innings)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(innings.id, inningsId));
};

export const getMatchWithInningsRepo = async (matchId: string) => {
  return db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    with: {
      innings: true,
    },
  });
};

export const getMatchesByTurfRepo = async (turfId: string) => {
  return db
    .select()
    .from(matches)
    .where(eq(matches.turfId, turfId))
    .orderBy(desc(matches.createdAt));
};

export const completeMatchRepo = async (matchId: string) => {
  await db
    .update(matches)
    .set({
      status: "COMPLETED",
      endTime: new Date(),
    })
    .where(eq(matches.id, matchId));
};
