import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";

export function requireMaintenanceRole(...roles: Array<"admin" | "worker">) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.maintenanceUser || !roles.includes(req.maintenanceUser.role)) {
      throw new ApiError(403, "MAINTENANCE_FORBIDDEN", "Maintenance role is not allowed to perform this action.");
    }

    next();
  };
}
