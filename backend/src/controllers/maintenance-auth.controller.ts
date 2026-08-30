import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { maintenanceAuthService } from "../services/maintenance-auth.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type {
  MaintenanceLoginInput,
  MaintenanceRequestPasswordResetInput,
  MaintenanceResetPasswordInput
} from "../validators/maintenance-auth.validator.js";

const refreshCookieName = "maintenance_refresh_token";

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(refreshCookieName, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/api/v1/maintenance/auth/refresh"
  });
}

export const maintenanceAuthController = {
  async login(req: Request, res: Response) {
    const result = await maintenanceAuthService.login(req.validated?.body as MaintenanceLoginInput);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { user: result.user, accessToken: result.accessToken });
  },

  async refresh(req: Request, res: Response) {
    const result = await maintenanceAuthService.refresh(req.cookies?.[refreshCookieName] as string | undefined);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { accessToken: result.accessToken });
  },

  async logout(req: Request, res: Response) {
    const result = await maintenanceAuthService.logout(req.cookies?.[refreshCookieName] as string | undefined);
    res.clearCookie(refreshCookieName, { path: "/api/v1/maintenance/auth/refresh" });
    sendSuccess(res, result);
  },

  async requestPasswordReset(req: Request, res: Response) {
    sendSuccess(res, await maintenanceAuthService.requestPasswordReset(req.validated?.body as MaintenanceRequestPasswordResetInput));
  },

  async resetPassword(req: Request, res: Response) {
    sendSuccess(res, await maintenanceAuthService.resetPassword(req.validated?.body as MaintenanceResetPasswordInput));
  }
};
