import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function requireAdminAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    throw new ApiError(401, "ADMIN_AUTH_REQUIRED", "Admin authentication is required.");
  }

  try {
    req.admin = verifyAccessToken(token);
    next();
  } catch {
    throw new ApiError(401, "INVALID_ADMIN_TOKEN", "Admin token is invalid or expired.");
  }
}

