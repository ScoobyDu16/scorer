import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { createPlayerService, getPlayersService } from "./player.service";

export const createPlayer = async (req: AuthRequest, res: Response) => {
  try {
    const turfId = req.turfId!;
    const player = await createPlayerService(turfId, req.body);

    res.status(201).json(player);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPlayers = async (req: AuthRequest, res: Response) => {
  try {
    const turfId = req.turfId!;
    const { search } = req.query;

    const players = await getPlayersService(
      turfId,
      search as string | undefined,
    );

    res.json(players);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
