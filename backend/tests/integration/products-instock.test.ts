import request from "supertest";
import type { Express } from "express";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/iphone_man_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-long-enough";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-long-enough";
process.env.MAINTENANCE_JWT_ACCESS_SECRET = "test-maintenance-access-secret-long";
process.env.MAINTENANCE_JWT_REFRESH_SECRET = "test-maintenance-refresh-secret-long";

const listMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/services/product.service.js", () => ({
  productService: {
    list: listMock,
    findBySlug: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

interface ListFilters {
  inStock?: boolean;
}

describe("GET /products inStock filter", () => {
  let app: Express;

  beforeAll(async () => {
    app = (await import("../../src/app.js")).app;
  });

  beforeEach(() => {
    listMock.mockReset();
    listMock.mockResolvedValue({ products: [], meta: { page: 1, limit: 20, total: 0, hasMore: false } });
  });

  it("passes a real boolean false to the service for ?inStock=false", async () => {
    await request(app).get("/api/v1/products?inStock=false").expect(200);

    const filters = listMock.mock.calls[0][0] as ListFilters;
    expect(filters.inStock).toBe(false);
  });

  it("passes a real boolean true to the service for ?inStock=true", async () => {
    await request(app).get("/api/v1/products?inStock=true").expect(200);

    const filters = listMock.mock.calls[0][0] as ListFilters;
    expect(filters.inStock).toBe(true);
  });

  it("does not treat inStock=false the same as inStock=true", async () => {
    await request(app).get("/api/v1/products?inStock=false").expect(200);
    await request(app).get("/api/v1/products?inStock=true").expect(200);

    expect((listMock.mock.calls[0][0] as ListFilters).inStock).toBe(false);
    expect((listMock.mock.calls[1][0] as ListFilters).inStock).toBe(true);
    expect((listMock.mock.calls[0][0] as ListFilters).inStock).not.toBe(
      (listMock.mock.calls[1][0] as ListFilters).inStock
    );
  });

  it("rejects non-boolean inStock values", async () => {
    const response = await request(app).get("/api/v1/products?inStock=1").expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
