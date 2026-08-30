import { withTransaction } from "../config/db.js";
import { brandModel } from "../models/brand.model.js";
import { ApiError } from "../utils/api-error.js";
import type { Locale } from "../validators/common.validator.js";
import type { CreateBrandInput, UpdateBrandInput } from "../validators/brand.validator.js";

export const brandService = {
  list: (locale: Locale = "en") => brandModel.list(locale),

  async create(input: CreateBrandInput) {
    return withTransaction(async (client) => {
      const brand = await brandModel.create(input, client);
      await brandModel.replaceTranslations(brand.id, input.translations, client);
      return brand;
    });
  },

  async update(id: number, input: UpdateBrandInput) {
    return withTransaction(async (client) => {
      const brand = await brandModel.update(id, input, client);
      if (!brand) {
        throw new ApiError(404, "BRAND_NOT_FOUND", "Brand was not found.");
      }
      if (input.translations) {
        await brandModel.replaceTranslations(brand.id, input.translations, client);
      }
      return brand;
    });
  },

  async delete(id: number) {
    const deleted = await brandModel.delete(id);
    if (!deleted) {
      throw new ApiError(404, "BRAND_NOT_FOUND", "Brand was not found.");
    }
    return { deleted: true };
  }
};

