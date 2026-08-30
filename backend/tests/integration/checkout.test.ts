import request from "supertest";
import type { Express } from "express";
import { beforeAll, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/iphone_man_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-long-enough";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-long-enough";

vi.mock("../../src/services/checkout.service.js", () => ({
  checkoutService: {
    checkout: vi.fn(async () => ({
      id: 1001,
      customer_email: "buyer@example.com",
      status: "pending",
      subtotal: "1099.00",
      discount: "0.00",
      shipping_fee: "0.00",
      tax: "0.00",
      total: "1099.00"
    }))
  }
}));

describe("checkout flow", () => {
  let app: Express;

  beforeAll(async () => {
    app = (await import("../../src/app.js")).app;
  });

  it("creates a guest order without auth", async () => {
    const response = await request(app)
      .post("/api/v1/checkout")
      .send({
        customerName: "Efficient Emma",
        customerEmail: "buyer@example.com",
        customerPhone: "+970599000000",
        shippingAddress: {
          line1: "Main Street 10",
          city: "Ramallah",
          country: "PS"
        },
        items: [{ productId: 1, quantity: 1 }]
      })
      .expect(201);

    expect(response.body.data.id).toBe(1001);
    expect(response.body.error).toBeNull();
  });

  it("rejects invalid checkout payloads before the controller", async () => {
    const response = await request(app)
      .post("/api/v1/checkout")
      .send({ customerEmail: "bad-email", items: [] })
      .expect(400);

    expect(response.body.data).toBeNull();
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
