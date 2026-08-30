import { createHash } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../src/utils/api-error.js";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/iphone_man_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-long-enough";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-long-enough";
process.env.MAINTENANCE_JWT_ACCESS_SECRET = "test-maintenance-access-secret-long";
process.env.MAINTENANCE_JWT_REFRESH_SECRET = "test-maintenance-refresh-secret-long";

const mocks = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  updatePasswordById: vi.fn(),
  createToken: vi.fn(),
  findValidByHash: vi.fn(),
  markUsed: vi.fn(),
  sendPasswordResetEmail: vi.fn()
}));

vi.mock("../../src/config/db.js", () => ({
  pool: { connect: vi.fn() },
  query: vi.fn(),
  withTransaction: vi.fn(async (callback: (client: unknown) => Promise<unknown>) => callback({ query: vi.fn() }))
}));

vi.mock("../../src/models/admin-user.model.js", () => ({
  adminUserModel: {
    findByEmail: mocks.findByEmail,
    updatePasswordById: mocks.updatePasswordById
  }
}));

vi.mock("../../src/models/admin-reset-token.model.js", () => ({
  adminResetTokenModel: {
    create: mocks.createToken,
    findValidByHash: mocks.findValidByHash,
    markUsed: mocks.markUsed
  }
}));

vi.mock("../../src/services/email.service.js", () => ({
  emailService: {
    sendOrderConfirmation: vi.fn(),
    sendPasswordResetEmail: mocks.sendPasswordResetEmail
  }
}));

describe("adminAuthService password reset", () => {
  beforeAll(async () => {
    await import("../../src/services/admin-auth.service.js");
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests a reset for an existing admin: stores only the token hash and emails the raw token", async () => {
    mocks.findByEmail.mockResolvedValue({ id: 1, email: "admin@iphoneman.test" });

    const { adminAuthService } = await import("../../src/services/admin-auth.service.js");
    const result = await adminAuthService.requestPasswordReset({ email: "admin@iphoneman.test" });

    expect(result).toEqual({ message: "If an account exists for this email, a reset link has been sent." });
    expect(mocks.findByEmail).toHaveBeenCalledWith("admin@iphoneman.test");
    expect(mocks.createToken).toHaveBeenCalledTimes(1);
    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledTimes(1);

    const rawToken = mocks.sendPasswordResetEmail.mock.calls[0][1] as string;
    expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(mocks.createToken.mock.calls[0][0]).toBe(1);
    expect(mocks.createToken.mock.calls[0][1]).toBe(createHash("sha256").update(rawToken).digest("hex"));

    const expiresAt = mocks.createToken.mock.calls[0][2] as Date;
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 30 * 60 * 1000);
  });

  it("returns the same message and creates nothing for an unknown email", async () => {
    mocks.findByEmail.mockResolvedValue(null);

    const { adminAuthService } = await import("../../src/services/admin-auth.service.js");
    const result = await adminAuthService.requestPasswordReset({ email: "nobody@example.com" });

    expect(result).toEqual({ message: "If an account exists for this email, a reset link has been sent." });
    expect(mocks.createToken).not.toHaveBeenCalled();
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("resets the password with a valid token and marks the token used", async () => {
    mocks.findValidByHash.mockResolvedValue({ id: 5, admin_user_id: 1, token_hash: "hash" });
    mocks.updatePasswordById.mockResolvedValue({ id: 1 });
    mocks.markUsed.mockResolvedValue(true);

    const { adminAuthService } = await import("../../src/services/admin-auth.service.js");
    const result = await adminAuthService.resetPassword({ resetToken: "a".repeat(64), newPassword: "NewPassword123" });

    expect(result).toEqual({ reset: true });
    expect(mocks.findValidByHash).toHaveBeenCalledWith(createHash("sha256").update("a".repeat(64)).digest("hex"));
    expect(mocks.updatePasswordById).toHaveBeenCalledWith(1, expect.stringMatching(/^\$2[aby]\$/), expect.anything());
    expect(mocks.markUsed).toHaveBeenCalledWith(5, expect.anything());
  });

  it("rejects an invalid, expired, or already-used token without touching the password", async () => {
    mocks.findValidByHash.mockResolvedValue(null);

    const { adminAuthService } = await import("../../src/services/admin-auth.service.js");

    await expect(
      adminAuthService.resetPassword({ resetToken: "b".repeat(64), newPassword: "NewPassword123" })
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_RESET_TOKEN",
      message: "Reset token is invalid, expired, or already used."
    });

    expect(mocks.updatePasswordById).not.toHaveBeenCalled();
    expect(mocks.markUsed).not.toHaveBeenCalled();
  });

  it("rejects the whole transaction if the token was already consumed concurrently", async () => {
    mocks.findValidByHash.mockResolvedValue({ id: 9, admin_user_id: 2, token_hash: "hash" });
    mocks.updatePasswordById.mockResolvedValue({ id: 2 });
    mocks.markUsed.mockResolvedValue(false);

    const { adminAuthService } = await import("../../src/services/admin-auth.service.js");

    const error = await adminAuthService
      .resetPassword({ resetToken: "c".repeat(64), newPassword: "NewPassword123" })
      .then(() => null)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(401);
    expect((error as ApiError).code).toBe("INVALID_RESET_TOKEN");
  });

  it("runs the full request-reset to reset-password flow end to end", async () => {
    mocks.findByEmail.mockResolvedValue({ id: 1, email: "admin@iphoneman.test" });

    const { adminAuthService } = await import("../../src/services/admin-auth.service.js");
    await adminAuthService.requestPasswordReset({ email: "admin@iphoneman.test" });

    const rawToken = mocks.sendPasswordResetEmail.mock.calls[0][1] as string;
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    mocks.findValidByHash.mockResolvedValue({ id: 5, admin_user_id: 1, token_hash: tokenHash });
    mocks.updatePasswordById.mockResolvedValue({ id: 1 });
    mocks.markUsed.mockResolvedValue(true);

    const result = await adminAuthService.resetPassword({ resetToken: rawToken, newPassword: "NewPassword123" });

    expect(result).toEqual({ reset: true });
    expect(mocks.findValidByHash).toHaveBeenCalledWith(tokenHash);
    expect(mocks.updatePasswordById).toHaveBeenCalledWith(1, expect.stringMatching(/^\$2[aby]\$/), expect.anything());
    expect(mocks.markUsed).toHaveBeenCalledWith(5, expect.anything());
  });

  it("rejects reusing an already-used token on a second attempt", async () => {
    const token = "d".repeat(64);
    const tokenHash = createHash("sha256").update(token).digest("hex");
    mocks.findValidByHash.mockResolvedValueOnce({ id: 5, admin_user_id: 1, token_hash: tokenHash });
    mocks.updatePasswordById.mockResolvedValue({ id: 1 });
    mocks.markUsed.mockResolvedValue(true);

    const { adminAuthService } = await import("../../src/services/admin-auth.service.js");
    await adminAuthService.resetPassword({ resetToken: token, newPassword: "NewPassword123" });

    mocks.findValidByHash.mockResolvedValueOnce(null);
    await expect(
      adminAuthService.resetPassword({ resetToken: token, newPassword: "NewPassword123" })
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_RESET_TOKEN"
    });
    expect(mocks.markUsed).toHaveBeenCalledTimes(1);
  });
});
