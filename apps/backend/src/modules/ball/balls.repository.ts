import { desc, eq } from "drizzle-orm";
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
