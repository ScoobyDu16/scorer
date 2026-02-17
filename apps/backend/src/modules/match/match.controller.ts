import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  addBallService,
  addMatchPlayersService,
  createMatchService,
  endInningsService,
  startInningsService,
  undoLastBallService,
} from "./match.service";

export const createMatch = async (req: AuthRequest, res: Response) => {
  try {
    const turfId = req.turfId!;
    const match = await createMatchService(turfId, req.body);

    res.status(201).json(match);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addMatchPlayers = async (req: AuthRequest, res: Response) => {
  try {
    const matchIdParam = req.params.matchId;

    if (!matchIdParam || Array.isArray(matchIdParam)) {
      return res.status(400).json({ message: "Invalid matchId" });
    }

    const matchId = matchIdParam;
    const { players } = req.body;

    const result = await addMatchPlayersService(matchId, players);

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const startMatch = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;

    const innings = await startInningsService(matchId);

    res.json({
      message: "Match started",
      innings,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const addBall = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;

    const ball = await addBallService(matchId, req.body);

    res.status(201).json(ball);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const undoLastBall = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;

    const ball = await undoLastBallService(matchId);

    res.json({
      message: "Last ball undone",
      ball,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const endInnings = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;

    const result = await endInningsService(matchId);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
