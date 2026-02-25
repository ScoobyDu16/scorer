import { getMatchByIdRepo, updateMatchRepo } from "../match/match.repository";
import {
  createAccessCodeRepo,
  findValidAccessCodeRepo,
  markAccessCodeUsedRepo,
  getMatchesWithActiveCodesRepo,
} from "./access-code.repository";
import { MATCH_STATUS } from "../../db/schema/enums";

/**
 * Generate random 6 digit code
 */
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateAccessCodeService = async (matchId: string) => {
  /**
   * 1️⃣ Get match to fetch turfId
   */
  const match = await getMatchByIdRepo(matchId);

  if (!match) {
    throw new Error("Match not found");
  }

  const turfId = match.turfId;

  /**
   * 2️⃣ Generate code
   */
  const code = generateCode();

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  /**
   * 3️⃣ Save access code with matchId
   */
  const record = await createAccessCodeRepo({
    turfId,
    matchId,
    code,
    expiresAt,
  });

  return record;
};

export const validateAccessCodeService = async (
  matchId: string,
  code: string,
) => {
  const record = await findValidAccessCodeRepo(matchId, code);

  if (!record) {
    throw new Error("Invalid or expired code");
  }

  await markAccessCodeUsedRepo(record.id);

  // Update match status to ACCESS_VERIFIED after successful validation
  await updateMatchRepo(matchId, { status: MATCH_STATUS.ACCESS_VERIFIED });

  return record;
};

export const getMatchesWithoutActiveCodesService = async (matches: any[]) => {
  const matchIds = matches.map(match => match.id);
  
  if (matchIds.length === 0) {
    return matches;
  }

  const activeCodeMatchIds = await getMatchesWithActiveCodesRepo(matchIds);
  
  return matches.filter(match => !activeCodeMatchIds.includes(match.id));
};
