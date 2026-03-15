import { getPlayersRepo } from "../player/player.repository";
import { getMatchesByTurfRepo } from "../match/match.repository";
import {
  getTopBestAverageRepo,
  getTopBestEconomyRepo,
  getTopBestStrikeRateRepo,
  getTopMostDotsBowledRepo,
  getTopMostFoursRepo,
  getTopMostRunsRepo,
  getTopMostSixesRepo,
  getTopMostWicketsRepo,
} from "./dashboard.repository";

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

export const getDashboardTopPlayersService = async (turfId: string) => {
  const [
    mostRuns,
    mostWickets,
    mostFours,
    mostSixes,
    mostDotsBowled,
    bestStrikeRate,
    bestAverage,
    bestEconomy,
  ] = await Promise.all([
    getTopMostRunsRepo(turfId),
    getTopMostWicketsRepo(turfId),
    getTopMostFoursRepo(turfId),
    getTopMostSixesRepo(turfId),
    getTopMostDotsBowledRepo(turfId),
    getTopBestStrikeRateRepo(turfId),
    getTopBestAverageRepo(turfId),
    getTopBestEconomyRepo(turfId),
  ]);

  return {
    mostRuns,
    mostWickets,
    mostFours,
    mostSixes,
    mostDotsBowled,
    bestStrikeRate,
    bestAverage,
    bestEconomy,
  };
};
