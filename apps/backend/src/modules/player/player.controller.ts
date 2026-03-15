import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  createPlayerService,
  getPlayerByIdService,
  getPlayerCareerStatsService,
  getPlayerCareerService,
  getPlayersService,
  updatePlayerService,
  deletePlayerService,
  getPlayersYetToBatService,
} from "./player.service";

export const createPlayer = async (req: AuthRequest, res: Response) => {
  try {
    const turfId = req.turfId!;
    const player = await createPlayerService(turfId, req.body);

    res.status(201).json(player);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPlayerCareer = async (req: AuthRequest, res: Response) => {
  try {
    const turfId = req.turfId!;
    const playerId = req.params.playerId as string;

    const career = await getPlayerCareerService(turfId, playerId);

    res.json(career);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPlayers = async (req: AuthRequest, res: Response) => {
  try {
    const turfId = req.turfId!;
    const {
      search,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const result = await getPlayersService(
      turfId,
      search as string | undefined,
      Number(page),
      Number(limit),
      sortBy as string,
      sortOrder as 'asc' | 'desc'
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPlayer = async (req: AuthRequest, res: Response) => {
  try {
    const playerId = req.params.playerId as string;

    const player = await getPlayerByIdService(playerId);

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json(player);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPlayerStats = async (req: AuthRequest, res: Response) => {
  try {
    const playerId = req.params.playerId as string;

    const stats = await getPlayerCareerStatsService(playerId);

    res.json(stats);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updatePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const turfId = req.turfId!;
    const playerId = req.params.playerId as string;

    const player = await updatePlayerService(playerId, req.body);
    res.json(player);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const playerId = req.params.playerId as string;

    await deletePlayerService(playerId);
    res.json({ message: "Player deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPlayersYetToBat = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId, team } = req.query;
    
    if (!matchId || !team) {
      return res.status(400).json({ 
        message: "matchId and team are required" 
      });
    }

    const players = await getPlayersYetToBatService(
      matchId as string, 
      team as "A" | "B"
    );

    res.json(players);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
