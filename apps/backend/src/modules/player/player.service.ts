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

export const getPlayersService = async (turfId: string, search?: string) => {
  return getPlayersRepo(turfId, search);
};

export const getPlayerCareerStatsService = async (playerId: string) => {
  const stats = await getPlayerCareerStatsRepo(playerId);

  if (!stats) {
    throw new Error("Player stats not found");
  }

  const runs = Number(stats.runs || 0);
  const ballsFaced = Number(stats.ballsFaced || 0);
  const fours = Number(stats.fours || 0);
  const sixes = Number(stats.sixes || 0);
  const wickets = Number(stats.wickets || 0);
  const oversBowled = Number(stats.oversBowled || 0);
  const runsConceded = Number(stats.runsConceded || 0);
  const matches = Number(stats.matches || 0);

  const strikeRate = ballsFaced > 0 ? (runs / ballsFaced) * 100 : 0;

  const economy = oversBowled > 0 ? runsConceded / oversBowled : 0;

  return {
    playerId,
    matches,
    runs,
    ballsFaced,
    fours,
    sixes,
    wickets,
    oversBowled,
    runsConceded,
    strikeRate: Number(strikeRate.toFixed(2)),
    economy: Number(economy.toFixed(2)),
  };
};
