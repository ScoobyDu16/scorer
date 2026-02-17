import { Request, Response } from "express";
import { registerTurfService, loginTurfService } from "./turf.service";

export const registerTurf = async (req: Request, res: Response) => {
  try {
    const result = await registerTurfService(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const loginTurf = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginTurfService(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
