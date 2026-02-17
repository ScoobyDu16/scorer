import { db } from "../../db/client";
import { accessCodes } from "../../db/schema";
import { eq, and, gt } from "drizzle-orm";

export const createAccessCodeRepo = async (data: any) => {
  const [code] = await db.insert(accessCodes).values(data).returning();
  return code;
};

export const findValidAccessCodeRepo = async (turfId: string, code: string) => {
  const now = new Date();

  const [record] = await db
    .select()
    .from(accessCodes)
    .where(
      and(
        eq(accessCodes.turfId, turfId),
        eq(accessCodes.code, code),
        eq(accessCodes.isUsed, false),
        gt(accessCodes.expiresAt, now),
      ),
    );

  return record;
};

export const markAccessCodeUsedRepo = async (id: string) => {
  await db
    .update(accessCodes)
    .set({ isUsed: true })
    .where(eq(accessCodes.id, id));
};
