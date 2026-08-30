import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";
import { verifyMaintenanceAccessToken } from "../utils/jwt.js";

export function requireMaintenanceAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    throw new ApiError(401, "MAINTENANCE_AUTH_REQUIRED", "Maintenance authentication is required.");
  }

  try {
    req.maintenanceUser = verifyMaintenanceAccessToken(token);
    next();
  } catch {
    throw new ApiError(401, "INVALID_MAINTENANCE_TOKEN", "Maintenance token is invalid or expired.");
  }
}
