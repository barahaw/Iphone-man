import type { AdminTokenPayload, MaintenanceTokenPayload } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
      maintenanceUser?: MaintenanceTokenPayload;
      validated?: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
    }
  }
}

export {};

