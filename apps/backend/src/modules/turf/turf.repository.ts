import { db } from "../../db/client";
import { turfs } from "../../db/schema";
import { eq } from "drizzle-orm";

export const createTurf = async (data: any) => {
  const [turf] = await db.insert(turfs).values(data).returning();
  return turf;
};

export const findTurfByEmail = async (email: string) => {
  const [turf] = await db.select().from(turfs).where(eq(turfs.email, email));

  return turf;
};
