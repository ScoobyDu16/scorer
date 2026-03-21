import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { login, register, sendOTPToPhone, sendRegistrationOTP, LoginRequest, RegisterRequest } from "./auth.service";

export const loginUser = async (req: AuthRequest, res: Response) => {
  try {
    const loginData: LoginRequest = req.body;
    const result = await login(loginData);

    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const registerUser = async (req: AuthRequest, res: Response) => {
  try {
    const registerData: RegisterRequest = req.body;
    const { otp, ...userData } = registerData as any;
    
    const result = await register(userData, otp);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendOTP = async (req: AuthRequest, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number required" });
    }

    const result = await sendOTPToPhone(phone);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendRegistrationOTPController = async (req: AuthRequest, res: Response) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone number required" });
    }

    const result = await sendRegistrationOTP(email, phone);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    // Return user profile from JWT token
    if (!req.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    res.json({
      user: {
        id: req.userId,
        role: req.role,
        turfId: req.turfId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
