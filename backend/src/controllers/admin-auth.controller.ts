import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { adminAuthService } from "../services/admin-auth.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type {
  AdminLoginInput,
  AdminRequestPasswordResetInput,
  AdminResetPasswordInput
} from "../validators/admin-auth.validator.js";

const refreshCookieName = "admin_refresh_token";

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(refreshCookieName, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/api/v1/admin/auth/refresh"
  });
}

export const adminAuthController = {
  async login(req: Request, res: Response) {
    const result = await adminAuthService.login(req.validated?.body as AdminLoginInput);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { admin: result.admin, accessToken: result.accessToken });
  },

  async refresh(req: Request, res: Response) {
    const result = await adminAuthService.refresh(req.cookies?.[refreshCookieName] as string | undefined);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { accessToken: result.accessToken });
  },

  async logout(req: Request, res: Response) {
    const result = await adminAuthService.logout(req.cookies?.[refreshCookieName] as string | undefined);
    res.clearCookie(refreshCookieName, { path: "/api/v1/admin/auth/refresh" });
    sendSuccess(res, result);
  },

  async requestPasswordReset(req: Request, res: Response) {
    sendSuccess(res, await adminAuthService.requestPasswordReset(req.validated?.body as AdminRequestPasswordResetInput));
  },

  async resetPassword(req: Request, res: Response) {
    sendSuccess(res, await adminAuthService.resetPassword(req.validated?.body as AdminResetPasswordInput));
  }
};

