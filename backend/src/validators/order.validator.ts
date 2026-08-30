import { z } from "zod";
import { paginationQuerySchema } from "./common.validator.js";

export const orderListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]).optional()
});

export const orderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"])
});

