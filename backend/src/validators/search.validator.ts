import { z } from "zod";
import { localeSchema, paginationQuerySchema } from "./common.validator.js";

export const searchQuerySchema = paginationQuerySchema.extend({
  q: z.string().min(1).max(100),
  locale: localeSchema.default("en")
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
