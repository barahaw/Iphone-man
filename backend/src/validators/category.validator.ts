import { z } from "zod";
import { localeSchema } from "./common.validator.js";

const localizedTranslationSchema = z.object({
  locale: localeSchema,
  name: z.string().min(1),
  description: z.string().optional().nullable()
});

export const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  parentId: z.number().int().positive().optional().nullable(),
  displayOrder: z.number().int().default(0),
  translations: z.array(localizedTranslationSchema).min(1)
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  translations: z.array(localizedTranslationSchema).optional()
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

