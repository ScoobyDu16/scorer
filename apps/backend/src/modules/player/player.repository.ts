import { db } from "../../db/client";
import { players } from "../../db/schema";
import { eq, and, ilike } from "drizzle-orm";

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
