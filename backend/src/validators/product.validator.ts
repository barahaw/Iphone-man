import { z } from "zod";
import { localeSchema, paginationQuerySchema } from "./common.validator.js";

const productTranslationSchema = z.object({
  locale: localeSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  specifications: z.record(z.unknown()).default({}),
  warranty: z.string().optional().nullable()
});

export const productListQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  brandId: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  inStock: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  sort: z.enum(["price_asc", "price_desc", "newest", "rating", "popular"]).optional(),
  locale: localeSchema.default("en")
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  brandId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  images: z.array(z.string().url()).default([]),
  description: z.string().min(1),
  specifications: z.record(z.unknown()).default({}),
  compatibleDevices: z.array(z.string()).default([]),
  warranty: z.string().optional().nullable(),
  stockQuantity: z.number().int().nonnegative(),
  price: z.number().nonnegative(),
  discount: z.number().nonnegative().optional().nullable(),
  isActive: z.boolean().default(true),
  translations: z.array(productTranslationSchema).min(1)
});

export const updateProductSchema = createProductSchema.partial().extend({
  translations: z.array(productTranslationSchema).optional()
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

