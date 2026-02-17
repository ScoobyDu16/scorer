import {
  createAccessCodeRepo,
  findValidAccessCodeRepo,
  markAccessCodeUsedRepo,
} from "./access-code.repository";

/**
 * Generate random 6 digit code
 */
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateAccessCodeService = async (turfId: string) => {
  const code = generateCode();

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // valid for 10 minutes

  const record = await createAccessCodeRepo({
    turfId,
    code,
    expiresAt,
  });

  return record;
};

export const validateAccessCodeService = async (
  turfId: string,
  code: string,
) => {
  const record = await findValidAccessCodeRepo(turfId, code);

  if (!record) {
    throw new Error("Invalid or expired code");
  }

  // mark as used (one-time use)
  await markAccessCodeUsedRepo(record.id);

  return record;
};
