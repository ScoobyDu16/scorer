import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  generateAccessCodeService,
  validateAccessCodeService,
} from "./access-code.service";

/**
 * Owner generates code
 */
export const generateAccessCode = async (req: AuthRequest, res: Response) => {
  try {
    const turfId = req.turfId!;
    const code = await generateAccessCodeService(turfId);

    res.status(201).json(code);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Player validates code
 */
export const validateAccessCode = async (req: any, res: Response) => {
  try {
    const { turfId, code } = req.body;

    const record = await validateAccessCodeService(turfId, code);

    res.json({
      message: "Code valid",
      turfId: record.turfId,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
