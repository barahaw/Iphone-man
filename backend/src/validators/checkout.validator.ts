import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(5),
  shippingAddress: z.record(z.unknown()),
  couponCode: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      variantId: z.number().int().positive().optional().nullable(),
      quantity: z.number().int().positive()
    })
  ).min(1)
});

export const confirmationParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const confirmationQuerySchema = z.object({
  email: z.string().email()
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

