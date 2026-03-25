import { Response } from "express";
import {
  AuthenticatedRequest,
  AuthenticatedRequest as AuthRequest,
} from "../../middleware/auth";
import { matchLogger as businessLogger } from "../../utils/business-logger";
import {
  addBallService,
  addMatchPlayersService,
  changeBowlerService,
  createMatchService,
  deleteMatchService,
  endInningsService,
  getCreatedMatchesService,
  getMatchScoreService,
  getMatchScorecardService,
  getMatchPlayersService,
  getMatchesService,
  getMatchService,
  startInningsService,
  startSecondInningsService,
  undoLastBallService,
} from "./match.service";

export const deleteMatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;

    businessLogger.deleted("match", `match-id ${matchId}`);

    // Check if match exists
    const match = await getMatchService(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // TODO: Add business logic validation
    // - Check if match is in a state that allows deletion
    // - Clean up related data (innings, balls, etc.)

    // For now, proceed with deletion
    await deleteMatchService(matchId);

    businessLogger.success("match deleted", { matchId });

    res.json({ message: "Match deleted successfully" });
  } catch (error: any) {
    businessLogger.error("deleting match", error, {
      matchId: req.params.matchId,
    });
    res.status(500).json({ message: error.message });
  }
};

export const getMatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;

    businessLogger.fetching("match", `match-id ${matchId}`);

    const match = await getMatchService(matchId);

    businessLogger.found("match", match, { matchId });

    res.json(match);
  } catch (error: any) {
    businessLogger.error("fetching match", error, {
      matchId: req.params.matchId,
    });
    res.status(500).json({ message: error.message });
  }
};

export const getMatchScore = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const matchId = req.params.matchId as string;

    businessLogger.fetching("match score", `match-id ${matchId}`);

    const score = await getMatchScoreService(matchId);

    businessLogger.found("match", score, { matchId });

    res.json(score);
  } catch (error: any) {
    businessLogger.error("fetching match score", error, {
      matchId: req.params.matchId,
    });
    res.status(500).json({ message: error.message });
  }
};

export const getMatchScorecard = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const matchId = req.params.matchId as string;

    businessLogger.fetching("match scorecard", `match-id ${matchId}`);

    const scorecard = await getMatchScorecardService(matchId);

    businessLogger.found("match scorecard", scorecard, { matchId });

    res.json(scorecard);
  } catch (error: any) {
    businessLogger.error("fetching match scorecard", error, {
      matchId: req.params.matchId,
    });
    res.status(500).json({ message: error.message });
  }
};

export const getMatches = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const turfId = req.user?.turfId;

    if (!turfId) {
      return res.status(401).json({ message: "Turf ID not found" });
    }

    businessLogger.fetching("matches", `turf-id ${turfId}`);

    const matches = await getMatchesService(turfId);

    businessLogger.found("matches", matches, { turfId });

    res.json(matches);
  } catch (error: any) {
    businessLogger.error("fetching matches", error, {
      turfId: req.user?.turfId,
    });
    res.status(500).json({ message: error.message });
  }
};

export const getCreatedMatches = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const turfId = req.user?.turfId;

    if (!turfId) {
      return res.status(401).json({ message: "Turf ID not found" });
    }

    businessLogger.fetching("created matches", `turf-id ${turfId}`);

    const matches = await getCreatedMatchesService(turfId);

    businessLogger.found("created matches", matches, { turfId });

    res.json(matches);
  } catch (error: any) {
    businessLogger.error("fetching created matches", error, {
      turfId: req.user?.turfId,
    });
    res.status(500).json({ message: error.message });
  }
};

export const createMatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const turfId = req.user?.turfId!;
    const { teamAName, teamBName, overs } = req.body;

    businessLogger.start("creating match", {
      teams: `${teamAName} vs ${teamBName}`,
      turfId,
    });

    const match = await createMatchService(turfId, req.body);

    businessLogger.created("match", match.id, {
      teams: `${teamAName} vs ${teamBName}`,
      turfId,
    });

    res.status(201).json(match);
  } catch (error: any) {
    businessLogger.error("creating match", error, { turfId: req.user?.turfId });
    res.status(500).json({ message: error.message });
  }
};

export const addMatchPlayers = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const matchIdParam = req.params.matchId;

    if (!matchIdParam || Array.isArray(matchIdParam)) {
      return res.status(400).json({ message: "Invalid matchId" });
    }

    const matchId = matchIdParam;
    const { players } = req.body;

    businessLogger.start("adding players to match", {
      matchId,
      playerCount: players.length,
    });

    const result = await addMatchPlayersService(matchId, players);

    businessLogger.success("added players to match", {
      matchId,
      playerCount: players.length,
    });

    res.status(201).json(result);
  } catch (error: any) {
    businessLogger.error("adding players to match", error, {
      matchId: req.params.matchId,
    });
    res.status(500).json({ message: error.message });
  }
};

export const getMatchPlayers = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const matchId = req.params.matchId as string;

    businessLogger.fetching("match players", `match-id ${matchId}`);

    const players = await getMatchPlayersService(matchId);

    businessLogger.found("match players", players, { matchId });

    res.json(players);
  } catch (error: any) {
    businessLogger.error("fetching match players", error, {
      matchId: req.params.matchId,
    });
    res.status(500).json({ message: error.message });
  }
};

export const startMatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;
    const { strikerId, nonStrikerId, bowlerId } = req.body;

    businessLogger.start("starting match", {
      matchId,
      strikerId,
      nonStrikerId,
      bowlerId,
    });

    const innings = await startInningsService(matchId, {
      strikerId,
      nonStrikerId,
      bowlerId,
    });

    businessLogger.success("match started", { matchId, inningsId: innings.id });

    res.json({
      message: "Match started",
      innings,
    });
  } catch (error: any) {
    businessLogger.error("starting match", error, {
      matchId: req.params.matchId as string,
    });
    res.status(400).json({ message: error.message });
  }
};

export const startSecondInnings = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const matchId = req.params.matchId as string;
    const { strikerId, nonStrikerId, bowlerId } = req.body;

    businessLogger.start("starting second innings", {
      matchId,
      strikerId,
      nonStrikerId,
      bowlerId,
    });

    const innings = await startSecondInningsService(matchId, {
      strikerId,
      nonStrikerId,
      bowlerId,
    });

    businessLogger.success("second innings started", {
      matchId,
      inningsId: innings.id,
    });

    res.json({
      message: "Second innings started",
      innings,
    });
  } catch (error: any) {
    businessLogger.error("starting second innings", error, {
      matchId: req.params.matchId as string,
    });
    res.status(400).json({ message: error.message });
  }
};

export const addBall = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;

    businessLogger.start("recording ball", { matchId });

    const ball = await addBallService(matchId, req.body);

    businessLogger.success("ball recorded", { matchId, ballData: req.body });

    res.status(201).json(ball);
  } catch (error: any) {
    businessLogger.error("recording ball", error, {
      matchId: req.params.matchId,
    });
    res.status(500).json({ message: error.message });
  }
};

export const undoLastBall = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const matchId = req.params.matchId as string;

    businessLogger.start("undoing last ball", { matchId });

    const ball = await undoLastBallService(matchId);

    businessLogger.success("last ball undone", { matchId });

    res.json({
      message: "Last ball undone",
      ball,
    });
  } catch (error: any) {
    businessLogger.error("undoing last ball", error, {
      matchId: req.params.matchId,
    });
    res.status(400).json({ message: error.message });
  }
};

export const changeBowler = async (req: AuthRequest, res: Response) => {
  try {
    const inningsId = req.params.inningsId as string;
    const { newBowlerId } = req.body;

    businessLogger.start("changing bowler", { inningsId, newBowlerId });

    const result = await changeBowlerService(inningsId, newBowlerId);

    businessLogger.success("bowler changed", { inningsId, newBowlerId });

    res.json(result);
  } catch (error: any) {
    businessLogger.error("changing bowler", error, {
      inningsId: req.params.inningsId,
    });
    res.status(500).json({ message: error.message });
  }
};

export const endInnings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const matchId = req.params.matchId as string;

    businessLogger.start("ending innings", { matchId });

    const result = await endInningsService(matchId);

    businessLogger.success("innings ended", { matchId });

    res.json(result);
  } catch (error: any) {
    businessLogger.error("ending innings", error, {
      matchId: req.params.matchId as string,
    });
    res.status(400).json({ message: error.message });
  }
};
