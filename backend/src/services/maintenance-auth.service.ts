import bcrypt from "bcrypt";
import { withTransaction } from "../config/db.js";
import { env } from "../config/env.js";
import { maintenanceRefreshTokenModel } from "../models/maintenance-refresh-token.model.js";
import { maintenanceResetTokenModel } from "../models/maintenance-reset-token.model.js";
import { maintenanceUserModel } from "../models/maintenance-user.model.js";
import { ApiError } from "../utils/api-error.js";
import {
  getTokenExp,
  signMaintenanceAccessToken,
  signMaintenanceRefreshToken,
  verifyMaintenanceRefreshToken
} from "../utils/jwt.js";
import { generateResetToken, hashResetToken, RESET_TOKEN_EXPIRES_IN_MS } from "../utils/reset-token.js";
import type {
  MaintenanceLoginInput,
  MaintenanceRequestPasswordResetInput,
  MaintenanceResetPasswordInput
} from "../validators/maintenance-auth.validator.js";
import { emailService } from "./email.service.js";

export const maintenanceAuthService = {
  async login(input: MaintenanceLoginInput) {
    const user = await maintenanceUserModel.findByEmail(input.email);
    if (!user) {
      throw new ApiError(401, "INVALID_MAINTENANCE_CREDENTIALS", "Invalid maintenance credentials.");
    }

    const validPassword = await bcrypt.compare(input.password, user.password_hash);
    if (!validPassword) {
      throw new ApiError(401, "INVALID_MAINTENANCE_CREDENTIALS", "Invalid maintenance credentials.");
    }

    const payload = { maintenanceUserId: user.id, role: user.role };
    const tokenId = generateResetToken();
    const refreshToken = signMaintenanceRefreshToken({ ...payload, tokenId });
    const expiresAt = new Date(getTokenExp(refreshToken) * 1000);
    await maintenanceRefreshTokenModel.create(user.id, hashResetToken(tokenId), expiresAt);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken: signMaintenanceAccessToken(payload),
      refreshToken
    };
  },

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new ApiError(401, "MAINTENANCE_REFRESH_TOKEN_REQUIRED", "Refresh token is required.");
    }

    let payload;
    try {
      payload = verifyMaintenanceRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, "MAINTENANCE_INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
    }

    if (!payload.tokenId) {
      throw new ApiError(401, "MAINTENANCE_INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
    }

    let stored;
    try {
      stored = await maintenanceRefreshTokenModel.findByHash(hashResetToken(payload.tokenId));
    } catch {
      throw new ApiError(401, "MAINTENANCE_INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
    }
    if (!stored || stored.expires_at.getTime() <= Date.now()) {
      throw new ApiError(401, "MAINTENANCE_INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
    }

    if (stored.revoked_at) {
      // Reuse of an already-rotated token usually means theft: revoke every refresh
      // token for this user. A legitimate double-click could also trigger this.
      await maintenanceRefreshTokenModel.revokeAllForUser(stored.maintenance_user_id);
      throw new ApiError(401, "MAINTENANCE_INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
    }

    const user = await maintenanceUserModel.findById(payload.maintenanceUserId);
    if (!user) {
      throw new ApiError(401, "MAINTENANCE_USER_NOT_FOUND", "Maintenance user was not found.");
    }

    const tokenId = generateResetToken();
    const nextPayload = { maintenanceUserId: user.id, role: user.role, tokenId };
    const nextRefreshToken = signMaintenanceRefreshToken(nextPayload);
    const expiresAt = new Date(getTokenExp(nextRefreshToken) * 1000);

    await withTransaction(async (client) => {
      await maintenanceRefreshTokenModel.revoke(stored.id, client);
      await maintenanceRefreshTokenModel.create(user.id, hashResetToken(tokenId), expiresAt, client);
    });

    return {
      accessToken: signMaintenanceAccessToken({ maintenanceUserId: user.id, role: user.role }),
      refreshToken: nextRefreshToken
    };
  },

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) {
      return { loggedOut: true };
    }

    try {
      const payload = verifyMaintenanceRefreshToken(refreshToken);
      if (payload.tokenId) {
        await maintenanceRefreshTokenModel.revokeByHash(hashResetToken(payload.tokenId));
      }
    } catch {
      // Best-effort: an already-invalid or expired cookie just cannot be revoked.
    }

    return { loggedOut: true };
  },

  async requestPasswordReset(input: MaintenanceRequestPasswordResetInput) {
    const user = await maintenanceUserModel.findByEmail(input.email);
    if (user) {
      const resetToken = generateResetToken();
      const tokenHash = hashResetToken(resetToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_IN_MS);
      await maintenanceResetTokenModel.create(user.id, tokenHash, expiresAt);
      await emailService.sendPasswordResetEmail(user.email, resetToken);
    }

    return { message: "If an account exists for this email, a reset link has been sent." };
  },

  async resetPassword(input: MaintenanceResetPasswordInput) {
    const tokenHash = hashResetToken(input.resetToken);
    const token = await maintenanceResetTokenModel.findValidByHash(tokenHash);
    if (!token) {
      throw new ApiError(401, "INVALID_RESET_TOKEN", "Reset token is invalid, expired, or already used.");
    }

    const passwordHash = await bcrypt.hash(input.newPassword, env.BCRYPT_ROUNDS);

    await withTransaction(async (client) => {
      await maintenanceUserModel.updatePasswordById(token.maintenance_user_id, passwordHash, client);
      const consumed = await maintenanceResetTokenModel.markUsed(token.id, client);
      if (!consumed) {
        throw new ApiError(401, "INVALID_RESET_TOKEN", "Reset token is invalid, expired, or already used.");
      }
    });

    return { reset: true };
  }
};
