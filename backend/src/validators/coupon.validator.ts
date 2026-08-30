import { z } from "zod";

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().nonnegative()
});

export const createCouponSchema = z.object({
  code: z.string().min(1),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().nonnegative(),
  minOrderValue: z.number().nonnegative().default(0),
  expiresAt: z.string().datetime().optional().nullable(),
  usageLimit: z.number().int().nonnegative().optional().nullable()
});

export const updateCouponSchema = createCouponSchema.partial();

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;

