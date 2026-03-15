import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { balls } from "../../db/schema";

export const getLastBallsRepo = async (inningsId: string, limit: number) => {
  return db
    .select()
    .from(balls)
    .where(eq(balls.inningsId, inningsId))
    .orderBy(desc(balls.createdAt))
    .limit(limit);
};

export const getWicketBallsByInningsRepo = async (inningsId: string) => {
  return db
    .select()
    .from(balls)
    .where(and(eq(balls.inningsId, inningsId), eq(balls.isWicket, true)))
    .orderBy(asc(balls.overNumber), asc(balls.ballNumber));
};
