import request from "supertest";
import type { Express } from "express";
import { beforeAll, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/iphone_man_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-long-enough";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-long-enough";
process.env.MAINTENANCE_JWT_ACCESS_SECRET = "test-maintenance-access-secret-long";
process.env.MAINTENANCE_JWT_REFRESH_SECRET = "test-maintenance-refresh-secret-long";

vi.mock("../../src/services/maintenance-auth.service.js", () => ({
  maintenanceAuthService: {
    login: vi.fn(async () => ({
      user: { id: 2, name: "Rashid", email: "repair.worker@iphoneman.test", role: "worker" },
      accessToken: "maintenance-access-token",
      refreshToken: "maintenance-refresh-token"
    })),
    refresh: vi.fn(async () => ({
      accessToken: "next-maintenance-access-token",
      refreshToken: "next-maintenance-refresh-token"
    })),
    logout: vi.fn(async () => ({ loggedOut: true })),
    resetPassword: vi.fn(async () => ({ reset: true }))
  }
}));

vi.mock("../../src/services/maintenance-job.service.js", () => ({
  maintenanceJobService: {
    create: vi.fn(async () => ({
      id: 7,
      worker_id: 2,
      device_type: "iPhone 13",
      part_type: "Screen",
      cost_price: "45.00",
      customer_price: "90.00",
      percentage: "20.00",
      net_amount: "45.00",
      net_profit: "36.00"
    })),
    list: vi.fn(async () => ({
      jobs: [],
      meta: { page: 1, limit: 20, total: 0, hasMore: false }
    })),
    findById: vi.fn(async () => ({ id: 7, worker_id: 2, device_type: "iPhone 13", part_type: "Screen" })),
    update: vi.fn(async () => ({ id: 7, device_type: "iPhone 13", part_type: "Battery" })),
    delete: vi.fn(async () => ({ deleted: true })),
    exportMonthly: vi.fn(async () => ({
      month: "2026-08",
      filename: "maintenance-jobs-2026-08.xlsx",
      buffer: Buffer.from([1, 2, 3])
    }))
  }
}));

describe("maintenance module", () => {
  let app: Express;
  let workerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = (await import("../../src/app.js")).app;
    const { signMaintenanceAccessToken } = await import("../../src/utils/jwt.js");
    workerToken = signMaintenanceAccessToken({ maintenanceUserId: 2, role: "worker" });
    adminToken = signMaintenanceAccessToken({ maintenanceUserId: 1, role: "admin" });
  });

  it("logs a maintenance user in and sets an httpOnly refresh cookie", async () => {
    const response = await request(app)
      .post("/api/v1/maintenance/auth/login")
      .send({ email: "repair.worker@iphoneman.test", password: "Maintain123" })
      .expect(200);

    expect(response.body.data.accessToken).toBe("maintenance-access-token");
    expect(response.body.data.user.role).toBe("worker");
    expect(response.body.error).toBeNull();
    expect(response.headers["set-cookie"]?.[0]).toContain("maintenance_refresh_token=");
    expect(response.headers["set-cookie"]?.[0]).toContain("HttpOnly");
  });

  it("refreshes a maintenance access token from the refresh cookie", async () => {
    const response = await request(app)
      .post("/api/v1/maintenance/auth/refresh")
      .set("Cookie", ["maintenance_refresh_token=refresh-token"])
      .expect(200);

    expect(response.body.data.accessToken).toBe("next-maintenance-access-token");
    expect(response.body.error).toBeNull();
  });

  it("logs a maintenance user out, revoking the refresh cookie", async () => {
    const response = await request(app)
      .post("/api/v1/maintenance/auth/logout")
      .set("Cookie", ["maintenance_refresh_token=refresh-token"])
      .expect(200);

    expect(response.body.data).toEqual({ loggedOut: true });
    expect(response.body.error).toBeNull();
    const clearCookie = response.headers["set-cookie"]?.[0] ?? "";
    expect(clearCookie).toContain("maintenance_refresh_token=");
    expect(clearCookie).toContain("Thu, 01 Jan 1970");
  });

  it("rejects invalid maintenance login payloads", async () => {
    const response = await request(app)
      .post("/api/v1/maintenance/auth/login")
      .send({ email: "bad-email", password: "short" })
      .expect(400);

    expect(response.body.data).toBeNull();
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("requires auth to list maintenance jobs", async () => {
    const response = await request(app).get("/api/v1/maintenance/jobs").expect(401);
    expect(response.body.error.code).toBe("MAINTENANCE_AUTH_REQUIRED");
  });

  it("lets an authenticated worker create a job", async () => {
    const response = await request(app)
      .post("/api/v1/maintenance/jobs")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({
        deviceType: "iPhone 13",
        partType: "Screen",
        costPrice: 45,
        customerPrice: 90,
        percentage: 20
      })
      .expect(201);

    expect(response.body.data.net_amount).toBe("45.00");
    expect(response.body.error).toBeNull();
  });

  it("lets an authenticated worker list their own jobs", async () => {
    const response = await request(app)
      .get("/api/v1/maintenance/jobs")
      .set("Authorization", `Bearer ${workerToken}`)
      .expect(200);

    expect(response.body.data).toEqual([]);
    expect(response.body.meta.total).toBe(0);
  });

  it("blocks workers from exporting monthly jobs", async () => {
    const response = await request(app)
      .get("/api/v1/maintenance/jobs/export?month=2026-08")
      .set("Authorization", `Bearer ${workerToken}`)
      .expect(403);

    expect(response.body.error.code).toBe("MAINTENANCE_FORBIDDEN");
  });

  it("exports a monthly workbook as an admin", async () => {
    const response = await request(app)
      .get("/api/v1/maintenance/jobs/export?month=2026-08")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.headers["content-type"]).toContain("spreadsheetml");
    expect(response.headers["content-disposition"]).toContain("maintenance-jobs-2026-08.xlsx");
    expect(response.headers["content-length"]).toBe("3");
  });

  it("lets an admin update a job", async () => {
    const response = await request(app)
      .patch("/api/v1/maintenance/jobs/7")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ partType: "Battery", customerPrice: 100 })
      .expect(200);

    expect(response.body.data.part_type).toBe("Battery");
  });

  it("blocks workers from deleting jobs", async () => {
    const response = await request(app)
      .delete("/api/v1/maintenance/jobs/7")
      .set("Authorization", `Bearer ${workerToken}`)
      .expect(403);

    expect(response.body.error.code).toBe("MAINTENANCE_FORBIDDEN");
  });
});
