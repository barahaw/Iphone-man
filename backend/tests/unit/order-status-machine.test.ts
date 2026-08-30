import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../src/utils/api-error.js";

const mocks = vi.hoisted(() => ({
  findByIdForUpdate: vi.fn(),
  findItemStockRows: vi.fn(),
  updateStatus: vi.fn(),
  incrementStock: vi.fn(),
  decrementUsage: vi.fn()
}));

vi.mock("../../src/config/db.js", () => ({
  pool: { query: vi.fn() },
  withTransaction: vi.fn(async (callback: (client: unknown) => Promise<unknown>) => callback({ query: vi.fn() }))
}));

vi.mock("../../src/models/order.model.js", () => ({
  orderModel: {
    findByIdForUpdate: mocks.findByIdForUpdate,
    findItemStockRows: mocks.findItemStockRows,
    updateStatus: mocks.updateStatus
  }
}));

vi.mock("../../src/models/product.model.js", () => ({
  productModel: { incrementStock: mocks.incrementStock }
}));

vi.mock("../../src/models/coupon.model.js", () => ({
  couponModel: { decrementUsage: mocks.decrementUsage }
}));

interface OrderStatusService {
  updateStatus(id: number, status: string): Promise<unknown>;
}

describe("order status state machine", () => {
  let orderService: OrderStatusService;

  beforeEach(async () => {
    ({ orderService } = await import("../../src/services/order.service.js"));
    vi.clearAllMocks();
    mocks.updateStatus.mockImplementation(async (_id: number, status: string) => ({ id: 1, status }));
    mocks.incrementStock.mockResolvedValue(undefined);
    mocks.decrementUsage.mockResolvedValue({});
    mocks.findItemStockRows.mockResolvedValue([]);
  });

  it("rejects backwards transitions such as delivered -> pending", async () => {
    mocks.findByIdForUpdate.mockResolvedValue({ id: 1, status: "delivered", coupon_code: null });

    let caught: unknown;
    try {
      await orderService.updateStatus(1, "pending");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ApiError);
    const apiError = caught as ApiError;
    expect(apiError.statusCode).toBe(409);
    expect(apiError.code).toBe("INVALID_STATUS_TRANSITION");
    expect(apiError.details).toEqual({ from: "delivered", to: "pending" });
    expect(mocks.updateStatus).not.toHaveBeenCalled();
  });

  it("rejects transitions out of terminal states such as refunded -> shipped", async () => {
    mocks.findByIdForUpdate.mockResolvedValue({ id: 1, status: "refunded", coupon_code: null });

    let caught: unknown;
    try {
      await orderService.updateStatus(1, "shipped");
    } catch (error) {
      caught = error;
    }

    expect((caught as ApiError).code).toBe("INVALID_STATUS_TRANSITION");
    expect(mocks.updateStatus).not.toHaveBeenCalled();
  });

  it("rejects no-op transitions such as pending -> pending", async () => {
    mocks.findByIdForUpdate.mockResolvedValue({ id: 1, status: "pending", coupon_code: null });

    let caught: unknown;
    try {
      await orderService.updateStatus(1, "pending");
    } catch (error) {
      caught = error;
    }

    expect((caught as ApiError).code).toBe("INVALID_STATUS_TRANSITION");
    expect(mocks.updateStatus).not.toHaveBeenCalled();
  });

  it("allows the forward path pending -> processing -> shipped -> delivered", async () => {
    for (const [from, to] of [
      ["pending", "processing"],
      ["processing", "shipped"],
      ["shipped", "delivered"]
    ] as const) {
      mocks.findByIdForUpdate.mockResolvedValueOnce({ id: 1, status: from, coupon_code: null });
      await orderService.updateStatus(1, to);
      expect(mocks.updateStatus).toHaveBeenCalledWith(1, to, from, expect.anything());
    }

    expect(mocks.incrementStock).not.toHaveBeenCalled();
    expect(mocks.decrementUsage).not.toHaveBeenCalled();
  });

  it("allows delivered -> refunded", async () => {
    mocks.findByIdForUpdate.mockResolvedValue({ id: 1, status: "delivered", coupon_code: null });
    await orderService.updateStatus(1, "refunded");

    expect(mocks.updateStatus).toHaveBeenCalledWith(1, "refunded", "delivered", expect.anything());
  });

  it("returns 404 when the order does not exist", async () => {
    mocks.findByIdForUpdate.mockResolvedValue(null);

    let caught: unknown;
    try {
      await orderService.updateStatus(9999, "cancelled");
    } catch (error) {
      caught = error;
    }

    expect((caught as ApiError).statusCode).toBe(404);
    expect((caught as ApiError).code).toBe("ORDER_NOT_FOUND");
  });
});

describe("cancellation and refund side effects", () => {
  let orderService: OrderStatusService;

  beforeEach(async () => {
    ({ orderService } = await import("../../src/services/order.service.js"));
    vi.clearAllMocks();
    mocks.updateStatus.mockImplementation(async (_id: number, status: string) => ({ id: 7, status }));
    mocks.incrementStock.mockResolvedValue(undefined);
    mocks.decrementUsage.mockResolvedValue({});
  });

  it("restores stock for every item when cancelling a pending order", async () => {
    mocks.findByIdForUpdate.mockResolvedValue({ id: 7, status: "pending", coupon_code: null });
    mocks.findItemStockRows.mockResolvedValue([
      { product_id: 10, variant_id: null, quantity: 2 },
      { product_id: 11, variant_id: 55, quantity: 1 }
    ]);

    await orderService.updateStatus(7, "cancelled");

    expect(mocks.incrementStock).toHaveBeenCalledTimes(2);
    expect(mocks.incrementStock).toHaveBeenNthCalledWith(1, 10, null, 2, expect.anything());
    expect(mocks.incrementStock).toHaveBeenNthCalledWith(2, 11, 55, 1, expect.anything());
    expect(mocks.updateStatus).toHaveBeenCalledWith(7, "cancelled", "pending", expect.anything());
  });

  it("decrements coupon usage once when cancelling an order that used a coupon", async () => {
    mocks.findByIdForUpdate.mockResolvedValue({ id: 7, status: "processing", coupon_code: "WELCOME10" });
    mocks.findItemStockRows.mockResolvedValue([{ product_id: 10, variant_id: null, quantity: 1 }]);

    await orderService.updateStatus(7, "cancelled");

    expect(mocks.decrementUsage).toHaveBeenCalledTimes(1);
    expect(mocks.decrementUsage).toHaveBeenCalledWith("WELCOME10", expect.anything());
    expect(mocks.incrementStock).toHaveBeenCalledTimes(1);
  });

  it("restores stock and decrements coupon usage on refund of a delivered order", async () => {
    mocks.findByIdForUpdate.mockResolvedValue({ id: 7, status: "delivered", coupon_code: "SUMMER5" });
    mocks.findItemStockRows.mockResolvedValue([{ product_id: 12, variant_id: null, quantity: 3 }]);

    await orderService.updateStatus(7, "refunded");

    expect(mocks.incrementStock).toHaveBeenCalledWith(12, null, 3, expect.anything());
    expect(mocks.decrementUsage).toHaveBeenCalledWith("SUMMER5", expect.anything());
    expect(mocks.updateStatus).toHaveBeenCalledWith(7, "refunded", "delivered", expect.anything());
  });

  it("does not touch coupons when the order has no tracked coupon code", async () => {
    mocks.findByIdForUpdate.mockResolvedValue({ id: 7, status: "shipped", coupon_code: null });
    mocks.findItemStockRows.mockResolvedValue([{ product_id: 12, variant_id: null, quantity: 3 }]);

    await orderService.updateStatus(7, "refunded");

    expect(mocks.decrementUsage).not.toHaveBeenCalled();
    expect(mocks.incrementStock).toHaveBeenCalledTimes(1);
  });

  it("skips side effects entirely for forward transitions like processing -> shipped", async () => {
    mocks.findByIdForUpdate.mockResolvedValue({ id: 7, status: "processing", coupon_code: "WELCOME10" });

    await orderService.updateStatus(7, "shipped");

    expect(mocks.findItemStockRows).not.toHaveBeenCalled();
    expect(mocks.incrementStock).not.toHaveBeenCalled();
    expect(mocks.decrementUsage).not.toHaveBeenCalled();
    expect(mocks.updateStatus).toHaveBeenCalledWith(7, "shipped", "processing", expect.anything());
  });
});
