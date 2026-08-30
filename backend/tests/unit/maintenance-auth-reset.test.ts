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

vi.mock("../../src/models/maintenance-user.model.js", () => ({
  maintenanceUserModel: {
    findByEmail: mocks.findByEmail,
    updatePasswordById: mocks.updatePasswordById
  }
}));

vi.mock("../../src/models/maintenance-reset-token.model.js", () => ({
  maintenanceResetTokenModel: {
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

describe("maintenanceAuthService password reset", () => {
  beforeAll(async () => {
    await import("../../src/services/maintenance-auth.service.js");
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests a reset for an existing user: stores only the token hash and emails the raw token", async () => {
    mocks.findByEmail.mockResolvedValue({ id: 2, email: "repair.admin@iphoneman.test" });

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");
    const result = await maintenanceAuthService.requestPasswordReset({ email: "repair.admin@iphoneman.test" });

    expect(result).toEqual({ message: "If an account exists for this email, a reset link has been sent." });
    expect(mocks.findByEmail).toHaveBeenCalledWith("repair.admin@iphoneman.test");
    expect(mocks.createToken).toHaveBeenCalledTimes(1);
    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledTimes(1);

    const rawToken = mocks.sendPasswordResetEmail.mock.calls[0][1] as string;
    expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(mocks.createToken.mock.calls[0][0]).toBe(2);
    expect(mocks.createToken.mock.calls[0][1]).toBe(createHash("sha256").update(rawToken).digest("hex"));
  });

  it("returns the same message and creates nothing for an unknown email", async () => {
    mocks.findByEmail.mockResolvedValue(null);

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");
    const result = await maintenanceAuthService.requestPasswordReset({ email: "nobody@example.com" });

    expect(result).toEqual({ message: "If an account exists for this email, a reset link has been sent." });
    expect(mocks.createToken).not.toHaveBeenCalled();
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("resets the password with a valid token and marks the token used", async () => {
    mocks.findValidByHash.mockResolvedValue({ id: 7, maintenance_user_id: 2, token_hash: "hash" });
    mocks.updatePasswordById.mockResolvedValue({ id: 2 });
    mocks.markUsed.mockResolvedValue(true);

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");
    const result = await maintenanceAuthService.resetPassword({
      resetToken: "a".repeat(64),
      newPassword: "NewPassword123"
    });

    expect(result).toEqual({ reset: true });
    expect(mocks.findValidByHash).toHaveBeenCalledWith(createHash("sha256").update("a".repeat(64)).digest("hex"));
    expect(mocks.updatePasswordById).toHaveBeenCalledWith(2, expect.stringMatching(/^\$2[aby]\$/), expect.anything());
    expect(mocks.markUsed).toHaveBeenCalledWith(7, expect.anything());
  });

  it("rejects an invalid, expired, or already-used token without touching the password", async () => {
    mocks.findValidByHash.mockResolvedValue(null);

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");

    const error = await maintenanceAuthService
      .resetPassword({ resetToken: "b".repeat(64), newPassword: "NewPassword123" })
      .then(() => null)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(401);
    expect((error as ApiError).code).toBe("INVALID_RESET_TOKEN");
    expect(mocks.updatePasswordById).not.toHaveBeenCalled();
    expect(mocks.markUsed).not.toHaveBeenCalled();
  });

  it("runs the full request-reset to reset-password flow end to end", async () => {
    mocks.findByEmail.mockResolvedValue({ id: 2, email: "repair.admin@iphoneman.test" });

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");
    await maintenanceAuthService.requestPasswordReset({ email: "repair.admin@iphoneman.test" });

    const rawToken = mocks.sendPasswordResetEmail.mock.calls[0][1] as string;
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    mocks.findValidByHash.mockResolvedValue({ id: 7, maintenance_user_id: 2, token_hash: tokenHash });
    mocks.updatePasswordById.mockResolvedValue({ id: 2 });
    mocks.markUsed.mockResolvedValue(true);

    const result = await maintenanceAuthService.resetPassword({ resetToken: rawToken, newPassword: "NewPassword123" });

    expect(result).toEqual({ reset: true });
    expect(mocks.findValidByHash).toHaveBeenCalledWith(tokenHash);
    expect(mocks.updatePasswordById).toHaveBeenCalledWith(2, expect.stringMatching(/^\$2[aby]\$/), expect.anything());
    expect(mocks.markUsed).toHaveBeenCalledWith(7, expect.anything());
  });

  it("rejects reusing an already-used token on a second attempt", async () => {
    const token = "d".repeat(64);
    const tokenHash = createHash("sha256").update(token).digest("hex");
    mocks.findValidByHash.mockResolvedValueOnce({ id: 7, maintenance_user_id: 2, token_hash: tokenHash });
    mocks.updatePasswordById.mockResolvedValue({ id: 2 });
    mocks.markUsed.mockResolvedValue(true);

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");
    await maintenanceAuthService.resetPassword({ resetToken: token, newPassword: "NewPassword123" });

    mocks.findValidByHash.mockResolvedValueOnce(null);
    await expect(
      maintenanceAuthService.resetPassword({ resetToken: token, newPassword: "NewPassword123" })
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_RESET_TOKEN"
    });
    expect(mocks.markUsed).toHaveBeenCalledTimes(1);
  });
});
