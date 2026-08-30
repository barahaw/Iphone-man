import { beforeAll, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../src/utils/api-error.js";

const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
  decrementStock: vi.fn(),
  createOrder: vi.fn(),
  incrementUsage: vi.fn(),
  validate: vi.fn(),
  sendOrderConfirmation: vi.fn()
}));

vi.mock("../../src/config/db.js", () => ({
  pool: { connect: vi.fn() },
  query: vi.fn(),
  withTransaction: vi.fn(async (callback: (client: unknown) => Promise<unknown>) => callback({ query: vi.fn() }))
}));

vi.mock("../../src/models/product.model.js", () => ({
  productModel: {
    findById: mocks.findById,
    decrementStock: mocks.decrementStock
  }
}));

vi.mock("../../src/models/order.model.js", () => ({
  orderModel: { create: mocks.createOrder }
}));

vi.mock("../../src/models/coupon.model.js", () => ({
  couponModel: { incrementUsage: mocks.incrementUsage }
}));

vi.mock("../../src/services/coupon.service.js", () => ({
  couponService: { validate: mocks.validate },
  calculateCouponDiscount: vi.fn(() => 0)
}));

vi.mock("../../src/services/email.service.js", () => ({
  emailService: { sendOrderConfirmation: mocks.sendOrderConfirmation }
}));

describe("checkout stock concurrency", () => {
  beforeAll(async () => {
    mocks.findById.mockResolvedValue({ id: 1, is_active: true, stock_quantity: 1, price: "100.00", discount: null });
    mocks.createOrder.mockResolvedValue({ id: 2001 });
    mocks.incrementUsage.mockResolvedValue({});
    mocks.sendOrderConfirmation.mockResolvedValue(undefined);
  });

  it("only one of two concurrent checkouts succeeds for a single stock unit", async () => {
    mocks.decrementStock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const { checkoutService } = await import("../../src/services/checkout.service.js");
    const input = {
      customerName: "Buyer A",
      customerEmail: "buyer@example.com",
      customerPhone: "+970599000000",
      shippingAddress: { line1: "Main 1", city: "Ramallah", country: "PS" },
      items: [{ productId: 1, variantId: null, quantity: 1 }]
    };

    const results = await Promise.allSettled([
      checkoutService.checkout(input),
      checkoutService.checkout(input)
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const reason = (rejected[0] as PromiseRejectedResult).reason as ApiError;
    expect(reason).toBeInstanceOf(ApiError);
    expect(reason.statusCode).toBe(409);
    expect(reason.code).toBe("INSUFFICIENT_STOCK");
  });
});

describe("checkout coupon usage limit", () => {
  it("rejects the checkout when the coupon hits its usage limit inside the transaction", async () => {
    mocks.findById.mockResolvedValue({ id: 2, is_active: true, stock_quantity: 5, price: "50.00", discount: null });
    mocks.decrementStock.mockResolvedValue(true);
    mocks.createOrder.mockResolvedValue({ id: 2002 });
    mocks.validate.mockResolvedValue({
      coupon: {
        discount_type: "percentage",
        discount_value: "10",
        min_order_value: "0",
        expires_at: null,
        usage_limit: 1,
        times_used: 1
      },
      discount: 0
    });
    mocks.incrementUsage.mockResolvedValue(null);

    const { checkoutService } = await import("../../src/services/checkout.service.js");

    let caught: unknown;
    try {
      await checkoutService.checkout({
        customerName: "Buyer B",
        customerEmail: "buyer@example.com",
        customerPhone: "+970599000000",
        shippingAddress: { line1: "Main 1", city: "Ramallah", country: "PS" },
        couponCode: "WELCOME10",
        items: [{ productId: 2, variantId: null, quantity: 1 }]
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).statusCode).toBe(400);
    expect((caught as ApiError).code).toBe("COUPON_USAGE_LIMIT_REACHED");

    expect(mocks.incrementUsage).toHaveBeenCalledWith("WELCOME10", expect.anything());
    expect(mocks.decrementStock).toHaveBeenCalled();
    expect(mocks.createOrder).toHaveBeenCalled();
  });
});
