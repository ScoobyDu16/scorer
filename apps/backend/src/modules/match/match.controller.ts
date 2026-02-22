import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { matchLogger as businessLogger } from "../../utils/business-logger";
import {
  addBallService,
  addMatchPlayersService,
  createMatchService,
  endInningsService,
  getMatchScoreService,
  getMatchPlayersService,
  getMatchesService,
  startInningsService,
  undoLastBallService,
} from "./match.service";

export const getMatchScore = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;
    
    businessLogger.fetching('match score', `match-id ${matchId}`);
    
    const score = await getMatchScoreService(matchId);
    
    businessLogger.found('match', score, { matchId });
    
    res.json(score);
  } catch (error: any) {
    businessLogger.error('fetching match score', error, { matchId: req.params.matchId });
    res.status(500).json({ message: error.message });
  }
};

export const getMatches = async (req: AuthRequest, res: Response) => {
  try {
    const turfId = req.turfId!;
    
    businessLogger.fetching('matches', `turf-id ${turfId}`);
    
    const matches = await getMatchesService(turfId);
    
    businessLogger.found('matches', matches, { turfId });
    
    res.json(matches);
  } catch (error: any) {
    businessLogger.error('fetching matches', error, { turfId: req.turfId });
    res.status(500).json({ message: error.message });
  }
};

export const createMatch = async (req: AuthRequest, res: Response) => {
  try {
    const turfId = req.turfId!;
    const { teamAName, teamBName, overs } = req.body;
    
    businessLogger.start('creating match', { teams: `${teamAName} vs ${teamBName}`, turfId });
    
    const match = await createMatchService(turfId, req.body);
    
    businessLogger.created('match', match.id, { teams: `${teamAName} vs ${teamBName}`, turfId });
    
    res.status(201).json(match);
  } catch (error: any) {
    businessLogger.error('creating match', error, { turfId: req.turfId });
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

    businessLogger.start('adding players to match', { matchId, playerCount: players.length });
    
    const result = await addMatchPlayersService(matchId, players);
    
    businessLogger.success('added players to match', { matchId, playerCount: players.length });
    
    res.status(201).json(result);
  } catch (error: any) {
    businessLogger.error('adding players to match', error, { matchId: req.params.matchId });
    res.status(500).json({ message: error.message });
  }
};

export const getMatchPlayers = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;
    
    businessLogger.fetching('match players', `match-id ${matchId}`);
    
    const players = await getMatchPlayersService(matchId);
    
    businessLogger.found('match players', players, { matchId });
    
    res.json(players);
  } catch (error: any) {
    businessLogger.error('fetching match players', error, { matchId: req.params.matchId });
    res.status(500).json({ message: error.message });
  }
};

export const startMatch = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;
    const { strikerId, nonStrikerId, bowlerId } = req.body;

    businessLogger.start('starting match', { matchId, strikerId, nonStrikerId, bowlerId });

    const innings = await startInningsService(matchId, { strikerId, nonStrikerId, bowlerId });
    
    businessLogger.success('match started', { matchId, inningsId: innings.id });
    
    res.json({
      message: "Match started",
      innings,
    });
  } catch (error: any) {
    businessLogger.error('starting match', error, { matchId: req.params.matchId as string });
    res.status(400).json({ message: error.message });
  }
};

export const addBall = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;

    businessLogger.start('recording ball', { matchId });

    const ball = await addBallService(matchId, req.body);
    
    businessLogger.success('ball recorded', { matchId, ballData: req.body });
    
    res.status(201).json(ball);
  } catch (error: any) {
    businessLogger.error('recording ball', error, { matchId: req.params.matchId });
    res.status(500).json({ message: error.message });
  }
};

export const undoLastBall = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;

    businessLogger.start('undoing last ball', { matchId });

    const ball = await undoLastBallService(matchId);
    
    businessLogger.success('last ball undone', { matchId });
    
    res.json({
      message: "Last ball undone",
      ball,
    });
  } catch (error: any) {
    businessLogger.error('undoing last ball', error, { matchId: req.params.matchId });
    res.status(400).json({ message: error.message });
  }
};

export const endInnings = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;

    businessLogger.start('ending innings', { matchId });

    const result = await endInningsService(matchId);
    
    businessLogger.success('innings ended', { matchId });
    
    res.json(result);
  } catch (error: any) {
    businessLogger.error('ending innings', error, { matchId: req.params.matchId as string });
    res.status(400).json({ message: error.message });
  }
};
