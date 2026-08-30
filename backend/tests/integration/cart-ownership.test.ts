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
  create: vi.fn(),
  getOwnership: vi.fn(),
  findById: vi.fn(),
  upsertItem: vi.fn(),
  deleteItem: vi.fn()
}));

vi.mock("../../src/models/cart.model.js", () => ({
  cartModel: {
    create: mocks.create,
    getOwnership: mocks.getOwnership,
    findById: mocks.findById,
    upsertItem: mocks.upsertItem,
    deleteItem: mocks.deleteItem
  }
}));

const OWNER_SESSION = "owner-session-secret";
const ATTACKER_SESSION = "attacker-session-token";

const OWNERSHIP = { id: 501, session_id: OWNER_SESSION };

const PUBLIC_CART = {
  id: 501,
  created_at: new Date("2026-08-01T10:00:00Z").toISOString(),
  items: [
    {
      id: 3001,
      cart_id: 501,
      product_id: 101,
      variant_id: null,
      quantity: 2,
      name: "iPhone 15 Pro OLED Screen Replacement",
      price: "149.99",
      images: ["https://cdn.iphone-man.test/products/iphone-15-pro-oled.png"]
    }
  ]
};

function expectNoSessionLeak(body: unknown): void {
  const serialized = JSON.stringify(body);
  expect(serialized).not.toContain("session_id");
  expect(serialized).not.toContain("sessionId");
  expect(serialized).not.toContain(OWNER_SESSION);
  expect(serialized).not.toContain(ATTACKER_SESSION);
}

describe("Cart ownership enforcement", () => {
  let app: Express;

  beforeAll(async () => {
    app = (await import("../../src/app.js")).app;
  });

  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }
    mocks.getOwnership.mockResolvedValue(OWNERSHIP);
    mocks.findById.mockResolvedValue({ ...PUBLIC_CART });
    mocks.upsertItem.mockResolvedValue({ ...PUBLIC_CART });
    mocks.deleteItem.mockResolvedValue(true);
  });

  describe("GET /api/v1/cart/:id", () => {
    it("rejects with 400 VALIDATION_ERROR when sessionId is missing", async () => {
      const response = await request(app).get("/api/v1/cart/501").expect(400);

      expect(response.body.data).toBeNull();
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(mocks.getOwnership).not.toHaveBeenCalled();
      expect(mocks.findById).not.toHaveBeenCalled();
    });

    it("responds identically with 404 for a wrong sessionId and for a nonexistent cart", async () => {
      const wrongSession = await request(app).get(`/api/v1/cart/501?sessionId=${ATTACKER_SESSION}`).expect(404);

      expect(wrongSession.body.data).toBeNull();
      expect(wrongSession.body.error.code).toBe("CART_NOT_FOUND");
      expect(mocks.findById).not.toHaveBeenCalled();

      mocks.getOwnership.mockResolvedValue(null);
      const missingCart = await request(app).get(`/api/v1/cart/501?sessionId=${ATTACKER_SESSION}`).expect(404);

      expect(missingCart.body).toEqual(wrongSession.body);
    });

    it("returns the cart for the owning sessionId without leaking any session identifier", async () => {
      const response = await request(app).get(`/api/v1/cart/501?sessionId=${OWNER_SESSION}`).expect(200);

      expect(response.body.error).toBeNull();
      expect(response.body.data.id).toBe(501);
      expect(response.body.data.items).toHaveLength(1);
      expectNoSessionLeak(response.body);
    });
  });

  describe("PATCH /api/v1/cart/:id/items", () => {
    const payload = { productId: 101, variantId: null, quantity: 3 };
    const patch = () => request(app).patch(`/api/v1/cart/501/items?sessionId=${ATTACKER_SESSION}`);

    it("rejects with 400 VALIDATION_ERROR when sessionId is missing", async () => {
      const response = await request(app).patch("/api/v1/cart/501/items").send(payload).expect(400);

      expect(response.body.data).toBeNull();
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(mocks.upsertItem).not.toHaveBeenCalled();
    });

    it("responds identically with 404 for a wrong sessionId and for a nonexistent cart, writing nothing", async () => {
      const wrongSession = await patch().send(payload).expect(404);

      expect(wrongSession.body.data).toBeNull();
      expect(wrongSession.body.error.code).toBe("CART_NOT_FOUND");
      expect(mocks.upsertItem).not.toHaveBeenCalled();

      mocks.getOwnership.mockResolvedValue(null);
      const missingCart = await patch().send(payload).expect(404);

      expect(missingCart.body).toEqual(wrongSession.body);
      expect(mocks.upsertItem).not.toHaveBeenCalled();
    });

    it("updates and returns the cart for the owning sessionId without leaking any session identifier", async () => {
      const response = await request(app)
        .patch(`/api/v1/cart/501/items?sessionId=${OWNER_SESSION}`)
        .send(payload)
        .expect(200);

      expect(response.body.error).toBeNull();
      expect(mocks.upsertItem).toHaveBeenCalledWith(501, payload.productId, null, 3);
      expectNoSessionLeak(response.body);
    });
  });

  describe("DELETE /api/v1/cart/:id/items/:itemId", () => {
    const del = () => request(app).delete(`/api/v1/cart/501/items/3001?sessionId=${ATTACKER_SESSION}`);

    it("rejects with 400 VALIDATION_ERROR when sessionId is missing", async () => {
      const response = await request(app).delete("/api/v1/cart/501/items/3001").expect(400);

      expect(response.body.data).toBeNull();
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(mocks.deleteItem).not.toHaveBeenCalled();
    });

    it("responds identically with 404 for a wrong sessionId and for a nonexistent cart, deleting nothing", async () => {
      const wrongSession = await del().expect(404);

      expect(wrongSession.body.data).toBeNull();
      expect(wrongSession.body.error.code).toBe("CART_NOT_FOUND");
      expect(mocks.deleteItem).not.toHaveBeenCalled();

      mocks.getOwnership.mockResolvedValue(null);
      const missingCart = await del().expect(404);

      expect(missingCart.body).toEqual(wrongSession.body);
      expect(mocks.deleteItem).not.toHaveBeenCalled();
    });

    it("deletes the line for the owning sessionId without leaking any session identifier", async () => {
      const response = await request(app)
        .delete(`/api/v1/cart/501/items/3001?sessionId=${OWNER_SESSION}`)
        .expect(200);

      expect(response.body.error).toBeNull();
      expect(response.body.data.deleted).toBe(true);
      expect(mocks.deleteItem).toHaveBeenCalledWith(501, 3001);
      expectNoSessionLeak(response.body);
    });
  });
});
