import { db } from "../../db/client";
import { matches, matchPlayers } from "../../db/schema";

export const createMatchRepo = async (data: any) => {
  const [match] = await db.insert(matches).values(data).returning();
  return match;
};

export const addMatchPlayersRepo = async (data: any[]) => {
  return db.insert(matchPlayers).values(data).returning();
};
