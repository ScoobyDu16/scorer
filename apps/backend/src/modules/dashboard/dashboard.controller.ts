import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { getDashboardStatsService } from "./dashboard.service";

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const turfId = req.turfId!;
    
    const stats = await getDashboardStatsService(turfId);
    
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
