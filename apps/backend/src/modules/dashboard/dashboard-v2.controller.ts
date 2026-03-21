import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { getDashboardData } from "./dashboard-v2.service";

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const dashboardData = await getDashboardData(req);
    res.json(dashboardData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
