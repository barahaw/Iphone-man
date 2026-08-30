import { z } from "zod";
import { localeSchema } from "./common.validator.js";

const localizedTranslationSchema = z.object({
  locale: localeSchema,
  name: z.string().min(1),
  description: z.string().optional().nullable()
});

export const createBrandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  logoUrl: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  translations: z.array(localizedTranslationSchema).min(1)
});

export const updateBrandSchema = createBrandSchema.partial().extend({
  translations: z.array(localizedTranslationSchema).optional()
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;

