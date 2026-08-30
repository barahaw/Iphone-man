import { withTransaction } from "../config/db.js";
import { couponModel } from "../models/coupon.model.js";
import { orderModel, type CreateOrderInput } from "../models/order.model.js";
import { productModel } from "../models/product.model.js";
import { ApiError } from "../utils/api-error.js";
import type { CheckoutInput } from "../validators/checkout.validator.js";
import { calculateCouponDiscount, couponService } from "./coupon.service.js";
import { emailService } from "./email.service.js";

const SHIPPING_FEE = 0;
const TAX_RATE = 0;

export const checkoutService = {
  async checkout(input: CheckoutInput) {
    const items: CreateOrderInput["items"] = [];
    let subtotal = 0;

    for (const item of input.items) {
      const product = await productModel.findById(item.productId);
      if (!product || !product.is_active) {
        throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
      }

      const unitPrice = Number(product.discount ?? product.price);
      subtotal += unitPrice * item.quantity;
      items.push({ ...item, unitPrice });
    }

    let discount = 0;
    if (input.couponCode) {
      const validation = await couponService.validate({ code: input.couponCode, subtotal });
      discount = calculateCouponDiscount(validation.coupon, subtotal);
    }

    const tax = Math.max(0, subtotal - discount) * TAX_RATE;
    const total = subtotal - discount + SHIPPING_FEE + tax;

    const order = await withTransaction(async (client) => {
      const createdOrder = await orderModel.create(
        {
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          shippingAddress: input.shippingAddress,
          subtotal,
          discount,
          shippingFee: SHIPPING_FEE,
        tax,
        total,
        couponCode: input.couponCode ?? null,
        items
      },
        client
      );

      for (const item of input.items) {
        const decremented = await productModel.decrementStock(item.productId, item.variantId, item.quantity, client);
        if (!decremented) {
          throw new ApiError(409, "INSUFFICIENT_STOCK", "Product stock is not sufficient.");
        }
      }

      if (input.couponCode) {
        const usageUpdated = await couponModel.incrementUsage(input.couponCode, client);
        if (!usageUpdated) {
          throw new ApiError(400, "COUPON_USAGE_LIMIT_REACHED", "Coupon usage limit has been reached.");
        }
      }

      return createdOrder;
    });

    await emailService.sendOrderConfirmation(order);
    return order;
  }
};
