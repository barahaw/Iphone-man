import request from "supertest";
import type { Express } from "express";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../src/utils/api-error.js";

process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/iphone_man_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-long-enough";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-long-enough";
process.env.MAINTENANCE_JWT_ACCESS_SECRET = "test-maintenance-access-secret-long";
process.env.MAINTENANCE_JWT_REFRESH_SECRET = "test-maintenance-refresh-secret-long";

const requestPasswordResetMock = vi.hoisted(() => vi.fn());
const resetPasswordMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/services/admin-auth.service.js", () => ({
  adminAuthService: {
    login: vi.fn(),
    refresh: vi.fn(),
    requestPasswordReset: requestPasswordResetMock,
    resetPassword: resetPasswordMock
  }
}));

describe("admin password reset endpoints", () => {
  let app: Express;

  beforeAll(async () => {
    app = (await import("../../src/app.js")).app;
  });

  beforeEach(() => {
    requestPasswordResetMock.mockReset();
    resetPasswordMock.mockReset();
  });

  it("requests a password reset and returns the generic message envelope", async () => {
    requestPasswordResetMock.mockResolvedValue({
      message: "If an account exists for this email, a reset link has been sent."
    });

    const response = await request(app)
      .post("/api/v1/admin/auth/request-password-reset")
      .send({ email: "admin@iphoneman.test" })
      .expect(200);

    expect(response.body.data.message).toBe("If an account exists for this email, a reset link has been sent.");
    expect(response.body.error).toBeNull();
    expect(requestPasswordResetMock).toHaveBeenCalledWith({ email: "admin@iphoneman.test" });
  });

  it("runs the full request-reset to reset-password flow", async () => {
    requestPasswordResetMock.mockResolvedValue({
      message: "If an account exists for this email, a reset link has been sent."
    });
    resetPasswordMock.mockResolvedValue({ reset: true });

    const requestResponse = await request(app)
      .post("/api/v1/admin/auth/request-password-reset")
      .send({ email: "admin@iphoneman.test" })
      .expect(200);
    expect(requestResponse.body.data.message).toBe("If an account exists for this email, a reset link has been sent.");

    const resetResponse = await request(app)
      .post("/api/v1/admin/auth/reset-password")
      .send({ resetToken: "a".repeat(64), newPassword: "NewPassword123" })
      .expect(200);
    expect(resetResponse.body.data.reset).toBe(true);
    expect(resetPasswordMock).toHaveBeenCalledWith({ resetToken: "a".repeat(64), newPassword: "NewPassword123" });
  });

  it("resets the password with a valid token", async () => {
    resetPasswordMock.mockResolvedValue({ reset: true });

    const response = await request(app)
      .post("/api/v1/admin/auth/reset-password")
      .send({ resetToken: "a".repeat(64), newPassword: "NewPassword123" })
      .expect(200);

    expect(response.body.data.reset).toBe(true);
    expect(response.body.error).toBeNull();
    expect(resetPasswordMock).toHaveBeenCalledWith({ resetToken: "a".repeat(64), newPassword: "NewPassword123" });
  });

  it("returns 401 INVALID_RESET_TOKEN for a bad, expired, or used token", async () => {
    resetPasswordMock.mockRejectedValue(
      new ApiError(401, "INVALID_RESET_TOKEN", "Reset token is invalid, expired, or already used.")
    );

    const response = await request(app)
      .post("/api/v1/admin/auth/reset-password")
      .send({ resetToken: "b".repeat(64), newPassword: "NewPassword123" })
      .expect(401);

    expect(response.body.data).toBeNull();
    expect(response.body.error.code).toBe("INVALID_RESET_TOKEN");
    expect(response.body.error.message).toBe("Reset token is invalid, expired, or already used.");
  });

  it("rejects a malformed request-password-reset body", async () => {
    const response = await request(app)
      .post("/api/v1/admin/auth/request-password-reset")
      .send({ email: "not-an-email" })
      .expect(400);

    expect(response.body.data).toBeNull();
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a reset-password body without newPassword", async () => {
    const response = await request(app)
      .post("/api/v1/admin/auth/reset-password")
      .send({ resetToken: "a".repeat(64) })
      .expect(400);

    expect(response.body.data).toBeNull();
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
