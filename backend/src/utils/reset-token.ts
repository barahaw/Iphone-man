import { createHash, randomBytes } from "node:crypto";

export const RESET_TOKEN_EXPIRES_IN_MS = 30 * 60 * 1000;

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
