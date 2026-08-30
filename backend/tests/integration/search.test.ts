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

vi.mock("../../src/services/search.service.js", () => ({
  searchService: {
    search: vi.fn(async () => ({
      products: [
        { id: 1, name: "iPhone 15 Clear Case", slug: "iphone-15-clear-case" },
        { id: 2, name: "Samsung S24 Case", slug: "samsung-s24-case" }
      ],
      meta: { page: 1, limit: 20, total: 2, hasMore: false }
    }))
  }
}));

describe("search endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = (await import("../../src/app.js")).app;
  });

  it("searches products without auth", async () => {
    const response = await request(app).get("/api/v1/search?q=case").expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].name).toBe("iPhone 15 Clear Case");
    expect(response.body.meta.total).toBe(2);
    expect(response.body.error).toBeNull();
  });

  it("rejects a search query without q", async () => {
    const response = await request(app).get("/api/v1/search").expect(400);

    expect(response.body.data).toBeNull();
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
