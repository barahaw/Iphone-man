import { couponModel } from "../models/coupon.model.js";
import { ApiError } from "../utils/api-error.js";
import type { CreateCouponInput, UpdateCouponInput, ValidateCouponInput } from "../validators/coupon.validator.js";

interface CouponRow {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  min_order_value: string;
  expires_at: Date | null;
  usage_limit: number | null;
  times_used: number;
}

export function calculateCouponDiscount(coupon: CouponRow, subtotal: number): number {
  if (coupon.discount_type === "percentage") {
    return Math.min(subtotal, subtotal * (Number(coupon.discount_value) / 100));
  }

  return Math.min(subtotal, Number(coupon.discount_value));
}

export const couponService = {
  async validate(input: ValidateCouponInput) {
    const coupon = await couponModel.findByCode(input.code) as CouponRow | null;
    if (!coupon) {
      throw new ApiError(404, "COUPON_NOT_FOUND", "Coupon was not found.");
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      throw new ApiError(400, "COUPON_EXPIRED", "Coupon has expired.");
    }

    if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
      throw new ApiError(400, "COUPON_USAGE_LIMIT_REACHED", "Coupon usage limit has been reached.");
    }

    if (input.subtotal < Number(coupon.min_order_value)) {
      throw new ApiError(400, "COUPON_MINIMUM_NOT_MET", "Order subtotal does not meet the coupon minimum.");
    }

    return {
      coupon,
      discount: calculateCouponDiscount(coupon, input.subtotal)
    };
  },

  list: () => couponModel.list(),
  create: (input: CreateCouponInput) => couponModel.create(input),

  async update(id: number, input: UpdateCouponInput) {
    const coupon = await couponModel.update(id, input);
    if (!coupon) {
      throw new ApiError(404, "COUPON_NOT_FOUND", "Coupon was not found.");
    }
    return coupon;
  },

  async delete(id: number) {
    const deleted = await couponModel.delete(id);
    if (!deleted) {
      throw new ApiError(404, "COUPON_NOT_FOUND", "Coupon was not found.");
    }
    return { deleted: true };
  }
};

