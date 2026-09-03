import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.number().int().positive(),
  reviewerName: z.string().min(1),
  reviewerEmail: z.string().email(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1)
});

export const reviewQuerySchema = z.object({
  product_id: z.coerce.number().int().positive()
});

export const reviewStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"])
});

export const reviewStatusQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional()
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

