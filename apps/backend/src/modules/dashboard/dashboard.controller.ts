import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { getDashboardStatsService, getDashboardTopPlayersService } from "./dashboard.service";

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const turfId = req.user?.turfId!;
    
    const stats = await getDashboardStatsService(turfId);
    
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardTopPlayers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const turfId = req.user?.turfId!;

    const data = await getDashboardTopPlayersService(turfId);

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
