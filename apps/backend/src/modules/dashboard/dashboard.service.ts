import { getPlayersRepo } from "../player/player.repository";
import { getMatchesByTurfRepo } from "../match/match.repository";

export const getDashboardStatsService = async (turfId: string) => {
  // Get total players count
  const playersResult = await getPlayersRepo(turfId);
  const totalPlayers = playersResult.players?.length || 0;

  // Get total matches count
  const matchesResult = await getMatchesByTurfRepo(turfId);
  const totalMatches = matchesResult?.length || 0;

  return {
    totalPlayers,
    totalMatches,
  };
};
