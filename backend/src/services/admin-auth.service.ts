import bcrypt from "bcrypt";
import { withTransaction } from "../config/db.js";
import { env } from "../config/env.js";
import { adminRefreshTokenModel } from "../models/admin-refresh-token.model.js";
import { adminResetTokenModel } from "../models/admin-reset-token.model.js";
import { adminUserModel } from "../models/admin-user.model.js";
import { ApiError } from "../utils/api-error.js";
import {
  getTokenExp,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/jwt.js";
import { generateResetToken, hashResetToken, RESET_TOKEN_EXPIRES_IN_MS } from "../utils/reset-token.js";
import type {
  AdminLoginInput,
  AdminRequestPasswordResetInput,
  AdminResetPasswordInput
} from "../validators/admin-auth.validator.js";
import { emailService } from "./email.service.js";

export const adminAuthService = {
  async login(input: AdminLoginInput) {
    const admin = await adminUserModel.findByEmail(input.email);
    if (!admin) {
      throw new ApiError(401, "INVALID_ADMIN_CREDENTIALS", "Invalid admin credentials.");
    }

    const validPassword = await bcrypt.compare(input.password, admin.password_hash);
    if (!validPassword) {
      throw new ApiError(401, "INVALID_ADMIN_CREDENTIALS", "Invalid admin credentials.");
    }

    const payload = { adminId: admin.id, role: admin.role };
    const tokenId = generateResetToken();
    const refreshToken = signRefreshToken({ ...payload, tokenId });
    const expiresAt = new Date(getTokenExp(refreshToken) * 1000);
    await adminRefreshTokenModel.create(admin.id, hashResetToken(tokenId), expiresAt);

    return {
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      },
      accessToken: signAccessToken(payload),
      refreshToken
    };
  },

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new ApiError(401, "REFRESH_TOKEN_REQUIRED", "Refresh token is required.");
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
    }

    if (!payload.tokenId) {
      throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
    }

    let stored;
    try {
      stored = await adminRefreshTokenModel.findByHash(hashResetToken(payload.tokenId));
    } catch {
      throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
    }
    if (!stored || stored.expires_at.getTime() <= Date.now()) {
      throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
    }

    if (stored.revoked_at) {
      // Reuse of an already-rotated token usually means theft: revoke every refresh
      // token for this admin. A legitimate double-click could also trigger this.
      await adminRefreshTokenModel.revokeAllForUser(stored.admin_user_id);
      throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
    }

    const admin = await adminUserModel.findById(payload.adminId);
    if (!admin) {
      throw new ApiError(401, "ADMIN_NOT_FOUND", "Admin user was not found.");
    }

    const tokenId = generateResetToken();
    const nextPayload = { adminId: admin.id, role: admin.role, tokenId };
    const nextRefreshToken = signRefreshToken(nextPayload);
    const expiresAt = new Date(getTokenExp(nextRefreshToken) * 1000);

    await withTransaction(async (client) => {
      await adminRefreshTokenModel.revoke(stored.id, client);
      await adminRefreshTokenModel.create(admin.id, hashResetToken(tokenId), expiresAt, client);
    });

    return {
      accessToken: signAccessToken({ adminId: admin.id, role: admin.role }),
      refreshToken: nextRefreshToken
    };
  },

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) {
      return { loggedOut: true };
    }

    try {
      const payload = verifyRefreshToken(refreshToken);
      if (payload.tokenId) {
        await adminRefreshTokenModel.revokeByHash(hashResetToken(payload.tokenId));
      }
    } catch {
      // Best-effort: an already-invalid or expired cookie just cannot be revoked.
    }

    return { loggedOut: true };
  },

  async requestPasswordReset(input: AdminRequestPasswordResetInput) {
    const admin = await adminUserModel.findByEmail(input.email);
    if (admin) {
      const resetToken = generateResetToken();
      const tokenHash = hashResetToken(resetToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_IN_MS);
      await adminResetTokenModel.create(admin.id, tokenHash, expiresAt);
      await emailService.sendPasswordResetEmail(admin.email, resetToken);
    }

    return { message: "If an account exists for this email, a reset link has been sent." };
  },

  async resetPassword(input: AdminResetPasswordInput) {
    const tokenHash = hashResetToken(input.resetToken);
    const token = await adminResetTokenModel.findValidByHash(tokenHash);
    if (!token) {
      throw new ApiError(401, "INVALID_RESET_TOKEN", "Reset token is invalid, expired, or already used.");
    }

    const passwordHash = await bcrypt.hash(input.newPassword, env.BCRYPT_ROUNDS);

    await withTransaction(async (client) => {
      await adminUserModel.updatePasswordById(token.admin_user_id, passwordHash, client);
      const consumed = await adminResetTokenModel.markUsed(token.id, client);
      if (!consumed) {
        throw new ApiError(401, "INVALID_RESET_TOKEN", "Reset token is invalid, expired, or already used.");
      }
    });

    return { reset: true };
  }
};

