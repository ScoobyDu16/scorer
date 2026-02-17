import {
  createPlayerRepo,
  findPlayerByUniqueFields,
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
