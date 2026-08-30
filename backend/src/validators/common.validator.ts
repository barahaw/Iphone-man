import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const slugParamSchema = z.object({
  slug: z.string().min(1)
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

export const localeSchema = z.enum(["en", "ar", "he"]);

export type Locale = z.infer<typeof localeSchema>;

export const localeQuerySchema = z.object({
  locale: localeSchema.default("en")
});

export const translationSchema = z.object({
  locale: localeSchema,
  name: z.string().min(1),
  description: z.string().optional()
});

