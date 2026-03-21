import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { 
  acquireScoringLock, 
  releaseScoringLock, 
  checkScoringLock, 
  extendScoringLock 
} from "./scoring-lock.service";

export const acquireLock = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { sessionId } = req.body;
    const userId = req.userId!;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const matchIdStr = Array.isArray(matchId) ? matchId[0] : matchId;
    const result = await acquireScoringLock(matchIdStr, userId, sessionId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(403).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const releaseLock = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { sessionId } = req.body;
    const userId = req.userId!;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const matchIdStr = Array.isArray(matchId) ? matchId[0] : matchId;
    const result = await releaseScoringLock(matchIdStr, userId, sessionId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const checkLock = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const matchIdStr = Array.isArray(matchId) ? matchId[0] : matchId;
    const result = await checkScoringLock(matchIdStr);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const extendLock = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { sessionId } = req.body;
    const userId = req.userId!;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const matchIdStr = Array.isArray(matchId) ? matchId[0] : matchId;
    const result = await extendScoringLock(matchIdStr, userId, sessionId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
