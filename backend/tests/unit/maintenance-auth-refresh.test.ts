import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/iphone_man_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-long-enough";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-long-enough";
process.env.MAINTENANCE_JWT_ACCESS_SECRET = "test-maintenance-access-secret-long";
process.env.MAINTENANCE_JWT_REFRESH_SECRET = "test-maintenance-refresh-secret-long";

const mocks = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  findByHash: vi.fn(),
  createToken: vi.fn(),
  revoke: vi.fn(),
  revokeByHash: vi.fn(),
  revokeAllForUser: vi.fn()
}));

vi.mock("../../src/config/db.js", () => ({
  pool: { connect: vi.fn() },
  query: vi.fn(),
  withTransaction: vi.fn(async (callback: (client: unknown) => Promise<unknown>) => callback({ query: vi.fn() }))
}));

vi.mock("../../src/models/maintenance-user.model.js", () => ({
  maintenanceUserModel: {
    findByEmail: mocks.findByEmail,
    findById: mocks.findById
  }
}));

vi.mock("../../src/models/maintenance-refresh-token.model.js", () => ({
  maintenanceRefreshTokenModel: {
    create: mocks.createToken,
    findByHash: mocks.findByHash,
    revoke: mocks.revoke,
    revokeByHash: mocks.revokeByHash,
    revokeAllForUser: mocks.revokeAllForUser
  }
}));

describe("maintenanceAuthService refresh rotation", () => {
  let passwordHash: string;
  let signRefreshToken: (payload: {
    maintenanceUserId: number;
    role: "admin" | "worker";
    tokenId?: string;
  }) => string;
  let verifyRefreshToken: (token: string) => {
    maintenanceUserId: number;
    role: string;
    tokenId?: string;
    exp?: number;
  };

  beforeAll(async () => {
    await import("../../src/services/maintenance-auth.service.js");
    const jwt = await import("../../src/utils/jwt.js");
    signRefreshToken = jwt.signMaintenanceRefreshToken;
    verifyRefreshToken = jwt.verifyMaintenanceRefreshToken;
    passwordHash = bcrypt.hashSync("Maintain123", 4);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("login embeds a tokenId claim and persists only its sha256 hash with matching expiry", async () => {
    mocks.findByEmail.mockResolvedValue({
      id: 2,
      name: "Rashid",
      email: "repair.worker@iphoneman.test",
      role: "worker",
      password_hash: passwordHash
    });
    mocks.createToken.mockResolvedValue({ id: 1 });

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");
    const result = await maintenanceAuthService.login({ email: "repair.worker@iphoneman.test", password: "Maintain123" });

    const tokenId = verifyRefreshToken(result.refreshToken).tokenId;
    expect(tokenId).toMatch(/^[a-f0-9]{64}$/);
    expect(mocks.createToken).toHaveBeenCalledTimes(1);
    expect(mocks.createToken.mock.calls[0][0]).toBe(2);
    expect(mocks.createToken.mock.calls[0][1]).toBe(createHash("sha256").update(tokenId as string).digest("hex"));

    const expiresAt = mocks.createToken.mock.calls[0][2] as Date;
    const expectedExpiry = new Date(verifyRefreshToken(result.refreshToken).exp! * 1000).getTime();
    expect(expiresAt.getTime()).toBe(expectedExpiry);
  });

  it("refresh rotates the token: revokes the old row and stores the new one in one transaction", async () => {
    const tokenId = "a".repeat(64);
    const refreshToken = signRefreshToken({ maintenanceUserId: 2, role: "worker", tokenId });
    mocks.findByHash.mockResolvedValue({
      id: 10,
      maintenance_user_id: 2,
      token_hash: createHash("sha256").update(tokenId).digest("hex"),
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      revoked_at: null,
      created_at: new Date()
    });
    mocks.findById.mockResolvedValue({ id: 2, name: "Rashid", role: "worker" });
    mocks.revoke.mockResolvedValue(true);
    mocks.createToken.mockResolvedValue({ id: 11 });

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");
    const result = await maintenanceAuthService.refresh(refreshToken);

    const nextTokenId = verifyRefreshToken(result.refreshToken).tokenId;
    expect(nextTokenId).not.toBe(tokenId);
    expect(mocks.revoke).toHaveBeenCalledWith(10, expect.anything());
    expect(mocks.createToken).toHaveBeenCalledTimes(1);
    expect(mocks.createToken.mock.calls[0][0]).toBe(2);
    expect(mocks.createToken.mock.calls[0][1]).toBe(createHash("sha256").update(nextTokenId as string).digest("hex"));
    expect(mocks.createToken.mock.calls[0][3]).toBeDefined();
  });

  it("refresh rejects a revoked token and revokes every session as reuse detection", async () => {
    const tokenId = "b".repeat(64);
    const refreshToken = signRefreshToken({ maintenanceUserId: 2, role: "worker", tokenId });
    mocks.findByHash.mockResolvedValue({
      id: 10,
      maintenance_user_id: 2,
      token_hash: createHash("sha256").update(tokenId).digest("hex"),
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      revoked_at: new Date(),
      created_at: new Date()
    });
    mocks.revokeAllForUser.mockResolvedValue(2);

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");

    await expect(maintenanceAuthService.refresh(refreshToken)).rejects.toMatchObject({
      statusCode: 401,
      code: "MAINTENANCE_INVALID_REFRESH_TOKEN"
    });
    expect(mocks.revokeAllForUser).toHaveBeenCalledWith(2);
    expect(mocks.revoke).not.toHaveBeenCalled();
  });

  it("refresh rejects a token whose DB row is missing", async () => {
    const tokenId = "c".repeat(64);
    const refreshToken = signRefreshToken({ maintenanceUserId: 2, role: "worker", tokenId });
    mocks.findByHash.mockResolvedValue(null);

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");

    await expect(maintenanceAuthService.refresh(refreshToken)).rejects.toMatchObject({
      statusCode: 401,
      code: "MAINTENANCE_INVALID_REFRESH_TOKEN"
    });
    expect(mocks.revokeAllForUser).not.toHaveBeenCalled();
  });

  it("refresh rejects a token without a tokenId claim", async () => {
    const refreshToken = signRefreshToken({ maintenanceUserId: 2, role: "worker" });

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");

    await expect(maintenanceAuthService.refresh(refreshToken)).rejects.toMatchObject({
      statusCode: 401,
      code: "MAINTENANCE_INVALID_REFRESH_TOKEN"
    });
    expect(mocks.findByHash).not.toHaveBeenCalled();
  });

  it("refresh rejects a token with an invalid signature", async () => {
    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");

    await expect(maintenanceAuthService.refresh("not-a-jwt")).rejects.toMatchObject({
      statusCode: 401,
      code: "MAINTENANCE_INVALID_REFRESH_TOKEN"
    });
  });

  it("logout revokes the persisted row for a valid token", async () => {
    const tokenId = "e".repeat(64);
    const refreshToken = signRefreshToken({ maintenanceUserId: 2, role: "worker", tokenId });
    mocks.revokeByHash.mockResolvedValue(true);

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");
    const result = await maintenanceAuthService.logout(refreshToken);

    expect(result).toEqual({ loggedOut: true });
    expect(mocks.revokeByHash).toHaveBeenCalledWith(createHash("sha256").update(tokenId).digest("hex"));
  });

  it("logout is best-effort for an invalid token and never throws", async () => {
    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");

    const result = await maintenanceAuthService.logout("not-a-jwt");

    expect(result).toEqual({ loggedOut: true });
    expect(mocks.revokeByHash).not.toHaveBeenCalled();
  });

  it("rejects reusing already-rotated token A after a successful refresh to token B", async () => {
    const tokenIdA = "f".repeat(64);
    const refreshTokenA = signRefreshToken({ maintenanceUserId: 2, role: "worker", tokenId: tokenIdA });
    const hashA = createHash("sha256").update(tokenIdA).digest("hex");

    mocks.findByHash
      .mockResolvedValueOnce({
        id: 10,
        maintenance_user_id: 2,
        token_hash: hashA,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
        revoked_at: null,
        created_at: new Date()
      })
      .mockResolvedValueOnce({
        id: 10,
        maintenance_user_id: 2,
        token_hash: hashA,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
        revoked_at: new Date(),
        created_at: new Date()
      });
    mocks.findById.mockResolvedValue({ id: 2, name: "Rashid", role: "worker" });
    mocks.revoke.mockResolvedValue(true);
    mocks.createToken.mockResolvedValue({ id: 11 });
    mocks.revokeAllForUser.mockResolvedValue(1);

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");

    const first = await maintenanceAuthService.refresh(refreshTokenA);
    const tokenIdB = verifyRefreshToken(first.refreshToken).tokenId;
    expect(tokenIdB).not.toBe(tokenIdA);

    await expect(maintenanceAuthService.refresh(refreshTokenA)).rejects.toMatchObject({
      statusCode: 401,
      code: "MAINTENANCE_INVALID_REFRESH_TOKEN"
    });
    expect(mocks.revokeAllForUser).toHaveBeenCalledWith(2);
  });

  it("a token that was logged out cannot refresh anymore, even though the JWT is unexpired", async () => {
    const tokenId = "g".repeat(64);
    const refreshToken = signRefreshToken({ maintenanceUserId: 2, role: "worker", tokenId });
    mocks.revokeByHash.mockResolvedValue(true);

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");
    await maintenanceAuthService.logout(refreshToken);
    expect(mocks.revokeByHash).toHaveBeenCalledWith(createHash("sha256").update(tokenId).digest("hex"));

    mocks.findByHash.mockResolvedValue({
      id: 10,
      maintenance_user_id: 2,
      token_hash: createHash("sha256").update(tokenId).digest("hex"),
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      revoked_at: new Date(),
      created_at: new Date()
    });
    mocks.revokeAllForUser.mockResolvedValue(1);

    await expect(maintenanceAuthService.refresh(refreshToken)).rejects.toMatchObject({
      statusCode: 401,
      code: "MAINTENANCE_INVALID_REFRESH_TOKEN"
    });
  });

  it("rejects an expired refresh JWT with 401, not 500", async () => {
    const expiredToken = jwt.sign(
      { maintenanceUserId: 2, role: "worker", tokenId: "h".repeat(64) },
      process.env.MAINTENANCE_JWT_REFRESH_SECRET as string,
      { expiresIn: -1 }
    );

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");

    await expect(maintenanceAuthService.refresh(expiredToken)).rejects.toMatchObject({
      statusCode: 401,
      code: "MAINTENANCE_INVALID_REFRESH_TOKEN"
    });
    expect(mocks.findByHash).not.toHaveBeenCalled();
  });

  it("rejects a refresh JWT with a wrong signature with 401, not 500", async () => {
    const wrongSecretToken = jwt.sign(
      { maintenanceUserId: 2, role: "worker", tokenId: "i".repeat(64) },
      "a-completely-different-secret"
    );

    const { maintenanceAuthService } = await import("../../src/services/maintenance-auth.service.js");

    await expect(maintenanceAuthService.refresh(wrongSecretToken)).rejects.toMatchObject({
      statusCode: 401,
      code: "MAINTENANCE_INVALID_REFRESH_TOKEN"
    });
    expect(mocks.findByHash).not.toHaveBeenCalled();
  });
});
