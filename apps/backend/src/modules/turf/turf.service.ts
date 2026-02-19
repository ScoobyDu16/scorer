import bcrypt from "bcrypt";
import { createTurf, findTurfByEmail } from "./turf.repository";
import { generateToken } from "../../utils/jwt";
import { authLogger } from "../../utils/logger";

export const registerTurfService = async (data: any, ip?: string) => {
  const existing = await findTurfByEmail(data.email);
  if (existing) {
    authLogger.register(data.email, false, ip);
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const turf = await createTurf({
    ...data,
    password: hashedPassword,
  });

  const token = generateToken({ turfId: turf.id });
  
  authLogger.register(data.email, true, ip);

  return { turf, token };
};

export const loginTurfService = async (email: string, password: string, ip?: string) => {
  const turf = await findTurfByEmail(email);
  if (!turf) {
    authLogger.login(email, false, ip);
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, turf.password);
  if (!isMatch) {
    authLogger.login(email, false, ip);
    throw new Error("Invalid credentials");
  }

  const token = generateToken({ turfId: turf.id });
  
  authLogger.login(email, true, ip);

  return { turf, token };
};
