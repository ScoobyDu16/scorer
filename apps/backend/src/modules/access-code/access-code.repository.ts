import { db } from "../../db/client";
import { accessCodes } from "../../db/schema";
import { eq, and, gt, inArray } from "drizzle-orm";

export const createAccessCodeRepo = async (data: {
  turfId: string;
  matchId: string;
  code: string;
  expiresAt: Date;
}) => {
  const [record] = await db.insert(accessCodes).values(data).returning();

  return record;
};

export const findValidAccessCodeRepo = async (
  matchId: string,
  code: string,
) => {
  const now = new Date();

  const [record] = await db
    .select()
    .from(accessCodes)
    .where(
      and(
        eq(accessCodes.matchId, matchId),
        eq(accessCodes.code, code),
        eq(accessCodes.isUsed, false),
        gt(accessCodes.expiresAt, now),
      ),
    );

  return record;
};

export const getMatchesWithActiveCodesRepo = async (matchIds: string[]) => {
  const now = new Date();
  
  const activeCodes = await db
    .select({ matchId: accessCodes.matchId })
    .from(accessCodes)
    .where(
      and(
        inArray(accessCodes.matchId, matchIds),
        eq(accessCodes.isUsed, false),
        gt(accessCodes.expiresAt, now),
      ),
    );

  return activeCodes.map(code => code.matchId);
};

export const markAccessCodeUsedRepo = async (id: string) => {
  await db
    .update(accessCodes)
    .set({ isUsed: true })
    .where(eq(accessCodes.id, id));
};

export const hasUsedAccessCodeForMatchRepo = async (
  matchId: string,
): Promise<boolean> => {
  const [record] = await db
    .select({ id: accessCodes.id })
    .from(accessCodes)
    .where(and(eq(accessCodes.matchId, matchId), eq(accessCodes.isUsed, true)))
    .limit(1);

  return !!record;
};
