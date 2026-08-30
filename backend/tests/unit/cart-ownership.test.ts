import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type * as cartModelModule from "../../src/models/cart.model.js";
import type * as cartServiceModule from "../../src/services/cart.service.js";

const mocks = vi.hoisted(() => ({
  query: vi.fn()
}));

vi.mock("../../src/config/db.js", () => ({
  pool: { query: mocks.query }
}));

interface ApiErrorShape {
  statusCode: number;
  code: string;
  message: string;
}

const OWNER_SESSION = "owner-session-secret";
const ATTACKER_SESSION = "attacker-session-token";

const OWNED_ROW = { id: 501, session_id: OWNER_SESSION };
const PUBLIC_CART_ROW = { id: 501, created_at: new Date("2026-08-01T10:00:00Z") };
const ITEM_ROWS = [
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
];

function stubDb(options: { ownership: typeof OWNED_ROW | null; itemDeleted?: boolean }): void {
  const { ownership, itemDeleted = false } = options;

  mocks.query.mockImplementation(async (sql: string) => {
    if (sql.includes("SELECT id, session_id FROM carts")) {
      return { rows: ownership ? [ownership] : [], rowCount: ownership ? 1 : 0 };
    }
    if (sql.includes("FROM carts WHERE id = $1")) {
      return { rows: [PUBLIC_CART_ROW], rowCount: 1 };
    }
    if (sql.startsWith("INSERT INTO carts")) {
      return { rows: [{ ...PUBLIC_CART_ROW }], rowCount: 1 };
    }
    if (sql.startsWith("DELETE FROM cart_items")) {
      return { rows: [], rowCount: itemDeleted ? 1 : 0 };
    }
    if (sql.startsWith("INSERT INTO cart_items")) {
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes("JOIN products p")) {
      return { rows: ITEM_ROWS.map((item) => ({ ...item })), rowCount: ITEM_ROWS.length };
    }
    throw new Error(`Unexpected SQL in test: ${sql}`);
  });
}

async function rejectionOf(promise: Promise<unknown>): Promise<ApiErrorShape> {
  try {
    await promise;
  } catch (error) {
    return error as ApiErrorShape;
  }
  throw new Error("Expected the promise to reject, but it resolved.");
}

function executedSql(): string[] {
  return mocks.query.mock.calls.map(([sql]) => String(sql));
}

describe("cartService ownership enforcement", () => {
  let cartService: (typeof cartServiceModule)["cartService"];
  let cartModel: (typeof cartModelModule)["cartModel"];

  beforeAll(async () => {
    ({ cartService } = await import("../../src/services/cart.service.js"));
    ({ cartModel } = await import("../../src/models/cart.model.js"));
  });

  beforeEach(() => {
    mocks.query.mockReset();
    stubDb({ ownership: OWNED_ROW });
  });

  describe("findById", () => {
    it("returns the public cart (without session_id) when sessionId matches", async () => {
      const cart = await cartService.findById(501, OWNER_SESSION);

      expect(cart).toEqual({ ...PUBLIC_CART_ROW, items: ITEM_ROWS });
      expect(cart).not.toHaveProperty("session_id");
      expect(executedSql().some((sql) => sql.includes("SELECT id, session_id FROM carts"))).toBe(true);
    });

    it("throws exactly CART_NOT_FOUND for a wrong sessionId and never loads cart data", async () => {
      const error = await rejectionOf(cartService.findById(501, ATTACKER_SESSION));

      expect(error).toMatchObject({ statusCode: 404, code: "CART_NOT_FOUND", message: "Cart was not found." });
      expect(mocks.query).toHaveBeenCalledTimes(1);
    });

    it("is indistinguishable between a wrong sessionId and a nonexistent cart", async () => {
      const wrongSessionError = await rejectionOf(cartService.findById(501, ATTACKER_SESSION));

      stubDb({ ownership: null });
      const missingCartError = await rejectionOf(cartService.findById(501, OWNER_SESSION));

      expect([missingCartError.statusCode, missingCartError.code, missingCartError.message]).toEqual([
        wrongSessionError.statusCode,
        wrongSessionError.code,
        wrongSessionError.message
      ]);
    });
  });

  describe("updateItem", () => {
    const input = { productId: 101, variantId: null as number | null, quantity: 2 };

    it("applies the upsert when sessionId matches", async () => {
      const cart = await cartService.updateItem(501, input, OWNER_SESSION);

      expect(cart).toEqual({ ...PUBLIC_CART_ROW, items: ITEM_ROWS });
      expect(cart).not.toHaveProperty("session_id");
      expect(executedSql().some((sql) => sql.startsWith("INSERT INTO cart_items"))).toBe(true);
    });

    it("throws exactly CART_NOT_FOUND for a wrong sessionId and writes nothing", async () => {
      const error = await rejectionOf(cartService.updateItem(501, input, ATTACKER_SESSION));

      expect(error).toMatchObject({ statusCode: 404, code: "CART_NOT_FOUND", message: "Cart was not found." });
      const sql = executedSql();
      expect(mocks.query).toHaveBeenCalledTimes(1);
      expect(sql.some((statement) => statement.startsWith("INSERT INTO cart_items") || statement.startsWith("DELETE FROM cart_items"))).toBe(false);
    });

    it("is indistinguishable between a wrong sessionId and a nonexistent cart", async () => {
      const wrongSessionError = await rejectionOf(cartService.updateItem(501, input, ATTACKER_SESSION));

      stubDb({ ownership: null });
      const missingCartError = await rejectionOf(cartService.updateItem(501, input, OWNER_SESSION));

      expect([missingCartError.statusCode, missingCartError.code, missingCartError.message]).toEqual([
        wrongSessionError.statusCode,
        wrongSessionError.code,
        wrongSessionError.message
      ]);
    });
  });

  describe("deleteItem", () => {
    it("deletes the line when sessionId matches and the line exists", async () => {
      stubDb({ ownership: OWNED_ROW, itemDeleted: true });

      const result = await cartService.deleteItem(501, 3001, OWNER_SESSION);

      expect(result).toEqual({ deleted: true });
      expect(executedSql().some((sql) => sql.startsWith("DELETE FROM cart_items"))).toBe(true);
    });

    it("throws CART_ITEM_NOT_FOUND when the cart is owned but the line does not exist", async () => {
      stubDb({ ownership: OWNED_ROW, itemDeleted: false });

      const error = await rejectionOf(cartService.deleteItem(501, 999999, OWNER_SESSION));

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("CART_ITEM_NOT_FOUND");
    });

    it("throws exactly CART_NOT_FOUND for a wrong sessionId and deletes nothing", async () => {
      const error = await rejectionOf(cartService.deleteItem(501, 3001, ATTACKER_SESSION));

      expect(error).toMatchObject({ statusCode: 404, code: "CART_NOT_FOUND", message: "Cart was not found." });
      expect(mocks.query).toHaveBeenCalledTimes(1);
      expect(executedSql().some((sql) => sql.startsWith("DELETE FROM cart_items"))).toBe(false);
    });

    it("is indistinguishable between a wrong sessionId and a nonexistent cart", async () => {
      const wrongSessionError = await rejectionOf(cartService.deleteItem(501, 3001, ATTACKER_SESSION));

      stubDb({ ownership: null });
      const missingCartError = await rejectionOf(cartService.deleteItem(501, 3001, OWNER_SESSION));

      expect([missingCartError.statusCode, missingCartError.code, missingCartError.message]).toEqual([
        wrongSessionError.statusCode,
        wrongSessionError.code,
        wrongSessionError.message
      ]);
    });
  });

  describe("model projections never expose session_id publicly", () => {
    it("findById selects explicit safe columns only", async () => {
      await cartModel.findById(501);

      const sql = executedSql();
      const cartSelect = sql.find((statement) => statement.includes("FROM carts WHERE id = $1"));
      expect(cartSelect).toBeDefined();
      expect(cartSelect).toContain("SELECT id, created_at FROM carts");
      expect(cartSelect).not.toContain("*");
      expect(cartSelect).not.toContain("session_id");

      const itemsSelect = sql.find((statement) => statement.includes("JOIN products p"));
      expect(itemsSelect).toBeDefined();
      expect(itemsSelect).not.toContain("session_id");
    });

    it("create returns only id and created_at", async () => {
      const row = await cartModel.create(OWNER_SESSION);

      const createSql = executedSql().find((statement) => statement.startsWith("INSERT INTO carts"));
      expect(createSql).toContain("RETURNING id, created_at");
      expect(createSql).not.toContain("RETURNING *");
      expect(row).toEqual(PUBLIC_CART_ROW);
      expect(row).not.toHaveProperty("session_id");
    });

    it("getOwnership returns only the internal ownership pair", async () => {
      const ownership = await cartModel.getOwnership(501);

      expect(ownership).toEqual(OWNED_ROW);
      expect(Object.keys(ownership ?? {})).toEqual(["id", "session_id"]);
    });
  });
});
