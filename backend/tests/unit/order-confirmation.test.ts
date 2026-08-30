import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type * as orderModelModule from "../../src/models/order.model.js";

const mocks = vi.hoisted(() => ({
  query: vi.fn()
}));

vi.mock("../../src/config/db.js", () => ({
  pool: { query: mocks.query }
}));

const PUBLIC_COLUMNS = ["id", "status", "subtotal", "discount", "shipping_fee", "tax", "total", "created_at", "customer_email"] as const;
const FORBIDDEN_COLUMNS = ["phone", "shipping_address", "coupon_code", "customer_name"] as const;

describe("orderModel.findConfirmation public projection", () => {
  let orderModel: (typeof orderModelModule)["orderModel"];

  beforeAll(async () => {
    ({ orderModel } = await import("../../src/models/order.model.js"));
  });

  beforeEach(() => {
    mocks.query.mockReset();
    mocks.query.mockResolvedValue({
      rows: [
        {
          id: 1001,
          status: "processing",
          subtotal: "259.98",
          discount: "26.00",
          shipping_fee: "0.00",
          tax: "0.00",
          total: "233.98",
          created_at: new Date("2026-08-01T10:00:00Z"),
          customer_email: "noor@example.com"
        }
      ]
    });
  });

  it("selects explicit safe columns and never exposes phone, shipping address or coupon code", async () => {
    const row = await orderModel.findConfirmation(1001, "noor@example.com");

    expect(mocks.query).toHaveBeenCalledTimes(1);
    const [sql, params] = mocks.query.mock.calls[0];

    expect(sql).not.toContain("SELECT *");
    expect(sql).not.toContain("*");
    for (const forbidden of FORBIDDEN_COLUMNS) {
      expect(sql).not.toContain(forbidden);
    }
    for (const column of PUBLIC_COLUMNS) {
      expect(sql).toContain(column);
    }
    expect(params).toEqual([1001, "noor@example.com"]);

    expect(row).not.toBeNull();
    for (const column of PUBLIC_COLUMNS) {
      expect(row).toHaveProperty(column);
    }
    for (const forbidden of [...FORBIDDEN_COLUMNS, "updated_at"]) {
      expect(row).not.toHaveProperty(forbidden);
    }
  });

  it("returns null when no order matches the id + email pair", async () => {
    mocks.query.mockResolvedValue({ rows: [] });

    const row = await orderModel.findConfirmation(9999, "wrong@example.com");

    expect(row).toBeNull();
  });
});
