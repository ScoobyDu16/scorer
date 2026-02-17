import { balls } from "../../db/schema";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
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
