import { z } from "zod";

export const createCartSchema = z.object({
  sessionId: z.string().min(8)
});

export const updateCartItemsSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().optional().nullable(),
  quantity: z.number().int().nonnegative()
});

export const cartOwnershipQuerySchema = z.object({
  sessionId: z.string().min(8)
});

export const cartIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const cartItemParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive()
});

export type CreateCartInput = z.infer<typeof createCartSchema>;
export type UpdateCartItemsInput = z.infer<typeof updateCartItemsSchema>;

