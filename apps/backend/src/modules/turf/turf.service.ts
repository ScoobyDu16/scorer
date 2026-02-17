import bcrypt from "bcrypt";
import { createTurf, findTurfByEmail } from "./turf.repository";
import { generateToken } from "../../utils/jwt";

export const registerTurfService = async (data: any) => {
  const existing = await findTurfByEmail(data.email);
  if (existing) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const turf = await createTurf({
    ...data,
    password: hashedPassword,
  });

  const token = generateToken({ turfId: turf.id });

  return { turf, token };
};

export const loginTurfService = async (email: string, password: string) => {
  const turf = await findTurfByEmail(email);
  if (!turf) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, turf.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken({ turfId: turf.id });

  return { turf, token };
};
