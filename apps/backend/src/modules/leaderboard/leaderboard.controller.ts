import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { getLeaderboardService } from "./leaderboard.service";
import { LeaderboardMetric } from "./leaderboard.repository";

const isLeaderboardMetric = (value: string): value is LeaderboardMetric => {
  return [
    "runs",
    "wickets",
    "fours",
    "sixes",
    "dotsBowled",
    "strikeRate",
    "average",
    "economy",
    "highestScore",
    "most100s",
    "most50s",
    "bestBowlingAverage",
    "bestBowlingFigures",
    "most3WicketHauls",
    "most5WicketHauls",
    "bestBowlingStrikeRate",
  ].includes(value);
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const turfId = req.turfId!;

    const metricRaw = String(req.query.metric || "runs");
    if (!isLeaderboardMetric(metricRaw)) {
      return res.status(400).json({ message: "Invalid metric" });
    }

    const limit = Number(req.query.limit || 20);
    const page = Number(req.query.page || 1);

    const data = await getLeaderboardService({
      turfId,
      metric: metricRaw,
      limit,
      page,
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
