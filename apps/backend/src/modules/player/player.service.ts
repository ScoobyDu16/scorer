import { ballsToOvers } from "../../utils/cricket";
import {
  createPlayerRepo,
  findPlayerByUniqueFields,
  getPlayerCareerStatsRepo,
  getPlayerCareerBattingAggRepo,
  getPlayerCareerBowlingAggRepo,
  getPlayerBestBowlingInningsRepo,
  getPlayersRepo,
  updatePlayerRepo,
  deletePlayerRepo,
  getPlayerByIdRepo,
  getPlayersYetToBatRepo,
} from "./player.repository";

export const createPlayerService = async (turfId: string, data: any) => {
  const existing = await findPlayerByUniqueFields(
    turfId,
    data.name,
    data.phone,
  );

  if (existing) {
    throw new Error("Player already exists");
  }

  const player = await createPlayerRepo({
    ...data,
    turfId,
  });

  return player;
};

export const getPlayerByIdService = async (playerId: string) => {
  return await getPlayerByIdRepo(playerId);
};

export const getPlayersService = async (
  turfId: string,
  search?: string,
  page = 1,
  limit = 20,
  sortBy = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
) => {
  const result = await getPlayersRepo(
    turfId,
    search,
    page,
    limit,
    sortBy,
    sortOrder
  );

  return {
    players: Array.isArray(result.players) ? result.players : [],
    pagination: result.pagination,
  };
};

export const getPlayerCareerStatsService = async (playerId: string) => {
  const stats = await getPlayerCareerStatsRepo(playerId);

  if (!stats) {
    throw new Error("Player stats not found");
  }

  // Batting
  const matches = Number(stats.matches || 0);
  const runs = Number(stats.runs || 0);
  const ballsFaced = Number(stats.ballsFaced || 0);
  const fours = Number(stats.fours || 0);
  const sixes = Number(stats.sixes || 0);

  // Bowling
  const wickets = Number(stats.wickets || 0);
  const ballsBowled = Number(stats.ballsBowled || 0);
  const runsConceded = Number(stats.runsConceded || 0);

  /**
   * Strike Rate
   */
  const strikeRate = ballsFaced > 0 ? (runs / ballsFaced) * 100 : 0;

  /**
   * Overs Bowled (derived)
   */
  const oversBowled = ballsToOvers(ballsBowled);

  /**
   * Economy
   * Economy = runs per over
   * = (runs / balls) * 6
   */
  const economy = ballsBowled > 0 ? (runsConceded / ballsBowled) * 6 : 0;

  return {
    playerId,
    matches,
    runs,
    ballsFaced,
    fours,
    sixes,
    wickets,
    ballsBowled,
    oversBowled: Number(oversBowled.toFixed(1)),
    runsConceded,
    strikeRate: Number(strikeRate.toFixed(2)),
    economy: Number(economy.toFixed(2)),
  };
};

export const getPlayerCareerService = async (turfId: string, playerId: string) => {
  const battingAgg = await getPlayerCareerBattingAggRepo(turfId, playerId);
  const bowlingAgg = await getPlayerCareerBowlingAggRepo(turfId, playerId);
  const bestBowling = await getPlayerBestBowlingInningsRepo(turfId, playerId);

  const battingMatches = Number(battingAgg?.matches || 0);
  const inningsBatted = Number(battingAgg?.inningsBatted || 0);
  const outs = Number((battingAgg as any)?.outs || 0);
  const runs = Number(battingAgg?.runs || 0);
  const highestScore = Number(battingAgg?.highestScore || 0);
  const ballsFaced = Number(battingAgg?.ballsFaced || 0);
  const fours = Number(battingAgg?.fours || 0);
  const sixes = Number(battingAgg?.sixes || 0);
  const ducks = Number(battingAgg?.ducks || 0);
  const strikeRate = Number(battingAgg?.strikeRate || 0);

  const inningsBowled = Number(bowlingAgg?.inningsBowled || 0);
  const ballsBowled = Number(bowlingAgg?.ballsBowled || 0);
  const dotsBowled = Number(bowlingAgg?.dotsBowled || 0);
  const maidens = Number(bowlingAgg?.maidens || 0);
  const runsConceded = Number(bowlingAgg?.runsConceded || 0);
  const wickets = Number(bowlingAgg?.wickets || 0);
  const economy = Number(bowlingAgg?.economy || 0);
  const bowlingStrikeRate = Number(bowlingAgg?.strikeRate || 0);
  const bowlingAverage = Number(bowlingAgg?.average || 0);

  const overs = ballsToOvers(ballsBowled);
  const bestBowlingText = bestBowling
    ? `${bestBowling.wickets}/${bestBowling.runsConceded}`
    : null;

  return {
    playerId,
    batting: {
      matches: battingMatches,
      inningsBatted,
      runs,
      highestScore,
      ballsFaced,
      fours,
      sixes,
      strikeRate: Number(strikeRate.toFixed(2)),
      average: outs > 0 ? Number((runs / outs).toFixed(2)) : 0,
      ducks,
    },
    bowling: {
      inningsBowled,
      ballsBowled,
      overs: Number(overs.toFixed(1)),
      runsConceded,
      wickets,
      bestBowling: bestBowlingText,
      economy: Number(economy.toFixed(2)),
      average: Number(bowlingAverage.toFixed(2)),
      strikeRate: Number(bowlingStrikeRate.toFixed(2)),
      maidens,
      dotsBowled,
    },
  };
};

export const updatePlayerService = async (playerId: string, data: any) => {
  const player = await updatePlayerRepo(playerId, data);
  if (!player) {
    throw new Error("Player not found");
  }
  return player;
};

export const deletePlayerService = async (playerId: string) => {
  await deletePlayerRepo(playerId);
};

export const getPlayersYetToBatService = async (matchId: string, team: "A" | "B") => {
  return await getPlayersYetToBatRepo(matchId, team);
};
