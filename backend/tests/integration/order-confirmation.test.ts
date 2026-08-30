import request from "supertest";
import type { Express } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/iphone_man_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-long-enough";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-long-enough";
process.env.MAINTENANCE_JWT_ACCESS_SECRET = "test-maintenance-access-secret-long";
process.env.MAINTENANCE_JWT_REFRESH_SECRET = "test-maintenance-refresh-secret-long";

const mocks = vi.hoisted(() => ({
  findConfirmation: vi.fn()
}));

vi.mock("../../src/models/order.model.js", () => ({
  orderModel: {
    findConfirmation: mocks.findConfirmation
  }
}));

const OWNER_EMAIL = "noor@example.com";
const ATTACKER_EMAIL = "attacker@example.com";

const PUBLIC_CONFIRMATION = {
  id: 1001,
  status: "processing",
  subtotal: "259.98",
  discount: "26.00",
  shipping_fee: "0.00",
  tax: "0.00",
  total: "233.98",
  created_at: new Date("2026-08-01T10:00:00Z").toISOString(),
  customer_email: OWNER_EMAIL
};

function expectNoPiiLeak(body: unknown): void {
  const serialized = JSON.stringify(body);
  expect(serialized).not.toContain("customer_phone");
  expect(serialized).not.toContain("shipping_address");
  expect(serialized).not.toContain("coupon_code");
}

describe("Guest order confirmation", () => {
  let app: Express;

  beforeEach(async () => {
    vi.resetModules();
    mocks.findConfirmation.mockReset();
    ({ app } = await import("../../src/app.js"));
  });

  it("responds identically with 404 for a nonexistent order and for a mismatched email", async () => {
    mocks.findConfirmation.mockResolvedValue(null);

    const missingOrder = await request(app)
      .get(`/api/v1/orders/9999/confirmation?email=${ATTACKER_EMAIL}`)
      .expect(404);

    expect(missingOrder.body.data).toBeNull();
    expect(missingOrder.body.error.code).toBe("ORDER_NOT_FOUND");

    mocks.findConfirmation.mockResolvedValue(null);
    const wrongEmail = await request(app)
      .get(`/api/v1/orders/1001/confirmation?email=${ATTACKER_EMAIL}`)
      .expect(404);

    expect(wrongEmail.body.data).toBeNull();
    expect(wrongEmail.body.error.code).toBe("ORDER_NOT_FOUND");

    expect(wrongEmail.body).toEqual(missingOrder.body);
  });

  it("returns only the minimal public fields for the matching id + email", async () => {
    mocks.findConfirmation.mockResolvedValue({ ...PUBLIC_CONFIRMATION });

    const response = await request(app)
      .get(`/api/v1/orders/1001/confirmation?email=${OWNER_EMAIL}`)
      .expect(200);

    expect(response.body.error).toBeNull();
    expect(response.body.data.id).toBe(1001);
    expect(response.body.data.status).toBe("processing");
    expect(response.body.data.total).toBe("233.98");
    expect(response.body.data.customer_email).toBe(OWNER_EMAIL);
    expectNoPiiLeak(response.body);
  });

  it("returns 429 once the same IP exceeds 10 confirmation lookups within the window", async () => {
    mocks.findConfirmation.mockResolvedValue({ ...PUBLIC_CONFIRMATION });

    for (let attempt = 1; attempt <= 10; attempt += 1) {
      await request(app)
        .get(`/api/v1/orders/1001/confirmation?email=${OWNER_EMAIL}`)
        .expect(200);
    }

    const blocked = await request(app)
      .get(`/api/v1/orders/1001/confirmation?email=${OWNER_EMAIL}`)
      .expect(429);

    expectNoPiiLeak(blocked.body);
  });
});
