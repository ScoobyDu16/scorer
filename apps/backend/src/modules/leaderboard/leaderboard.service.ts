import { getLeaderboardRepo, LeaderboardMetric } from "./leaderboard.repository";

export const getLeaderboardService = async (params: {
  turfId: string;
  metric: LeaderboardMetric;
  page: number;
  limit: number;
}) => {
  return getLeaderboardRepo(params);
};
