import request from "supertest";
import type { Express } from "express";
import { beforeAll, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/iphone_man_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-long-enough";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-long-enough";

vi.mock("../../src/services/admin-auth.service.js", () => ({
  adminAuthService: {
    login: vi.fn(async () => ({
      admin: { id: 1, name: "Admin Aisha", email: "admin@iphoneman.test", role: "super_admin" },
      accessToken: "access-token",
      refreshToken: "refresh-token"
    })),
    refresh: vi.fn(async () => ({
      accessToken: "next-access-token",
      refreshToken: "next-refresh-token"
    })),
    logout: vi.fn(async () => ({ loggedOut: true })),
    resetPassword: vi.fn(async () => ({ reset: true }))
  }
}));

describe("admin auth flow", () => {
  let app: Express;

  beforeAll(async () => {
    app = (await import("../../src/app.js")).app;
  });

  it("logs an admin in and sets an httpOnly refresh cookie", async () => {
    const response = await request(app)
      .post("/api/v1/admin/auth/login")
      .send({ email: "admin@iphoneman.test", password: "Admin12345" })
      .expect(200);

    expect(response.body.data.accessToken).toBe("access-token");
    expect(response.body.error).toBeNull();
    expect(response.headers["set-cookie"]?.[0]).toContain("admin_refresh_token=");
    expect(response.headers["set-cookie"]?.[0]).toContain("HttpOnly");
  });

  it("refreshes an admin access token from the refresh cookie", async () => {
    const response = await request(app)
      .post("/api/v1/admin/auth/refresh")
      .set("Cookie", ["admin_refresh_token=refresh-token"])
      .expect(200);

    expect(response.body.data.accessToken).toBe("next-access-token");
    expect(response.body.error).toBeNull();
  });

  it("logs an admin out, revoking the refresh cookie", async () => {
    const response = await request(app)
      .post("/api/v1/admin/auth/logout")
      .set("Cookie", ["admin_refresh_token=refresh-token"])
      .expect(200);

    expect(response.body.data).toEqual({ loggedOut: true });
    expect(response.body.error).toBeNull();
    const clearCookie = response.headers["set-cookie"]?.[0] ?? "";
    expect(clearCookie).toContain("admin_refresh_token=");
    expect(clearCookie).toContain("Thu, 01 Jan 1970");
  });
});
