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

const mocks = vi.hoisted(() => ({
  listByProduct: vi.fn()
}));

vi.mock("../../src/models/review.model.js", () => ({
  reviewModel: {
    listByProduct: mocks.listByProduct,
    create: vi.fn(),
    updateStatus: vi.fn(),
    refreshProductRating: vi.fn()
  }
}));

describe("GET /api/v1/reviews (public listing)", () => {
  let app: Express;

  beforeAll(async () => {
    app = (await import("../../src/app.js")).app;
  });

  beforeEach(() => {
    mocks.listByProduct.mockReset();
  });

  it("returns approved reviews without any reviewer email fields", async () => {
    const approvedReview = {
      id: 701,
      product_id: 101,
      reviewer_name: "Noor Haddad",
      rating: 5,
      comment: "Perfect fit and the colors are accurate. Highly recommend!",
      status: "approved",
      created_at: new Date("2026-08-01T10:00:00Z").toISOString()
    };
    mocks.listByProduct.mockResolvedValue([approvedReview, { ...approvedReview, id: 702, reviewer_name: "Omar S." }]);

    const response = await request(app).get("/api/v1/reviews?product_id=101").expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(2);
    for (const review of response.body.data) {
      expect(review).not.toHaveProperty("reviewer_email");
      expect(review).not.toHaveProperty("reviewerEmail");
      expect(JSON.stringify(review)).not.toContain("noor@example.com");
    }
    expect(response.body.data[0].reviewer_name).toBe("Noor Haddad");
    expect(response.body.error).toBeNull();
  });

  it("rejects the request when product_id is missing", async () => {
    const response = await request(app).get("/api/v1/reviews").expect(400);

    expect(response.body.data).toBeNull();
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(mocks.listByProduct).not.toHaveBeenCalled();
  });
});
