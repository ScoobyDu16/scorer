import { db } from "../../db/client";
import { matches } from "../../db/schema";

export const createMatchRepo = async (data: any) => {
  const [match] = await db.insert(matches).values(data).returning();
  return match;
};
