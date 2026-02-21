import { 
  getPlayersRepo
} from "../player/player.repository";
import { getMatchesByTurfRepo } from "../match/match.repository";

export const getDashboardStatsService = async (turfId: string) => {
  // Get total players count
  const players = await getPlayersRepo(turfId);
  const totalPlayers = players.length;

  // Get total matches count
  const matches = await getMatchesByTurfRepo(turfId);
  const totalMatches = matches.length;

  return {
    totalPlayers,
    totalMatches,
  };
};
