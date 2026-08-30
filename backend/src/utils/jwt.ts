import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AdminTokenPayload {
  adminId: number;
  role: "super_admin" | "staff";
  tokenId?: string;
}

export interface MaintenanceTokenPayload {
  maintenanceUserId: number;
  role: "admin" | "worker";
  tokenId?: string;
}

export function getTokenExp(token: string): number {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) {
    throw new Error("Token does not contain an exp claim.");
  }
  return decoded.exp;
}

export function signAccessToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]
  });
}

export function signRefreshToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AdminTokenPayload;
}

export function verifyRefreshToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AdminTokenPayload;
}

export function signMaintenanceAccessToken(payload: MaintenanceTokenPayload): string {
  return jwt.sign(payload, env.MAINTENANCE_JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]
  });
}

export function signMaintenanceRefreshToken(payload: MaintenanceTokenPayload): string {
  return jwt.sign(payload, env.MAINTENANCE_JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"]
  });
}

export function verifyMaintenanceAccessToken(token: string): MaintenanceTokenPayload {
  return jwt.verify(token, env.MAINTENANCE_JWT_ACCESS_SECRET) as MaintenanceTokenPayload;
}

export function verifyMaintenanceRefreshToken(token: string): MaintenanceTokenPayload {
  return jwt.verify(token, env.MAINTENANCE_JWT_REFRESH_SECRET) as MaintenanceTokenPayload;
}
