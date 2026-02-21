import { ballsToOvers } from "../../utils/cricket";
import {
  createPlayerRepo,
  findPlayerByUniqueFields,
  getPlayerCareerStatsRepo,
  getPlayersRepo,
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

export const getAllPlayersService = async (turfId: string) => {
  return getPlayersRepo(turfId);
};

export const getPlayersService = async (turfId: string, search?: string) => {
  return getPlayersRepo(turfId, search);
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
