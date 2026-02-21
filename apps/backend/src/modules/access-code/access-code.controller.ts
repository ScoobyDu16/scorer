import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  generateAccessCodeService,
  validateAccessCodeService,
} from "./access-code.service";
import { getMatchByIdRepo } from "../match/match.repository";
import { markAccessCodeUsedRepo } from "./access-code.repository";

/**
 * Owner generates code
 */
export const generateAccessCode = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.body;

    const record = await generateAccessCodeService(matchId);

    res.json(record);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Player validates code
 */
export const validateAccessCode = async (req: any, res: Response) => {
  try {
    const { matchId, code } = req.body;

    if (!matchId || !code) {
      return res.status(400).json({
        message: "matchId and code are required",
      });
    }

    const record = await validateAccessCodeService(matchId, code);

    if (!record) {
      throw new Error("Invalid or expired code");
    }

    // Get match details to include playersPerTeam
    const match = await getMatchByIdRepo(matchId);

    await markAccessCodeUsedRepo(record.id);

    res.json({
      message: "Code valid",
      matchId: record.matchId,
      turfId: record.turfId,
      match: {
        id: match.id,
        teamAName: match.teamAName,
        teamBName: match.teamBName,
        playersPerTeam: match.playersPerTeam,
        overs: match.overs,
        venue: match.venue,
        tossWinner: match.tossWinner,
        tossDecision: match.tossDecision
      }
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
