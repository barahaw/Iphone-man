import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";

export function requireRole(...roles: Array<"super_admin" | "staff">) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      throw new ApiError(403, "ADMIN_FORBIDDEN", "Admin role is not allowed to perform this action.");
    }

    next();
  };
}

