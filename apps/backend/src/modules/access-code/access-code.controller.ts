import { Response, Request } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import {
  generateAccessCodeService,
  validateAccessCodeService,
} from "./access-code.service";
import { getMatchByIdRepo } from "../match/match.repository";

/**
 * Owner generates code
 */
export const generateAccessCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
export const validateAccessCode = async (req: Request, res: Response): Promise<void> => {
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

    // Get updated match details (status should now be ACCESS_VERIFIED)
    const match = await getMatchByIdRepo(matchId);

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    res.json({
      message: "Code valid",
      matchId: record.matchId,
      turfId: record.turfId,
      status: match.status,
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
