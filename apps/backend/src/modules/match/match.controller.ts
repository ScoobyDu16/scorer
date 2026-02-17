import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { createMatchService } from "./match.service";

export const createMatch = async (req: AuthRequest, res: Response) => {
  try {
    const turfId = req.turfId!;
    const match = await createMatchService(turfId, req.body);

    res.status(201).json(match);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
