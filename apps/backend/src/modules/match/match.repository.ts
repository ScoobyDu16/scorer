import { balls } from "../../db/schema";
import { sql, desc, eq } from "drizzle-orm";

import { db } from "../../db/client";
import { innings, matches, matchPlayers } from "../../db/schema";

export const createMatchRepo = async (data: any) => {
  const [match] = await db.insert(matches).values(data).returning();
  return match;
};

export const addMatchPlayersRepo = async (data: any[]) => {
  return db.insert(matchPlayers).values(data).returning();
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
  wicket: boolean,
  overNumber: number,
  ballNumber: number,
) => {
  const oversValue = `${overNumber}.${ballNumber}`;

  await db.execute(sql`
    UPDATE innings
    SET
      total_runs = total_runs + ${runsToAdd},
      total_wickets = total_wickets + ${wicket ? 1 : 0},
      total_overs = ${oversValue},
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
  wicket: boolean,
  overNumber: number,
  ballNumber: number,
) => {
  // Calculate previous ball
  let prevOver = overNumber;
  let prevBall = ballNumber - 1;

  if (prevBall < 0) {
    prevOver = overNumber - 1;
    prevBall = 5;
  }

  const oversValue = prevOver >= 0 ? `${prevOver}.${prevBall}` : "0.0";

  await db.execute(sql`
    UPDATE innings
    SET
      total_runs = total_runs - ${runsToSubtract},
      total_wickets = total_wickets - ${wicket ? 1 : 0},
      total_overs = ${oversValue},
      updated_at = NOW()
    WHERE id = ${inningsId}
  `);
};
