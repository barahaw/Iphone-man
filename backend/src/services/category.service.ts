import { withTransaction } from "../config/db.js";
import { categoryModel } from "../models/category.model.js";
import { ApiError } from "../utils/api-error.js";
import type { Locale } from "../validators/common.validator.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "../validators/category.validator.js";

export const categoryService = {
  list: (locale: Locale = "en") => categoryModel.list(locale),

  async create(input: CreateCategoryInput) {
    return withTransaction(async (client) => {
      const category = await categoryModel.create(input, client);
      await categoryModel.replaceTranslations(category.id, input.translations, client);
      return category;
    });
  },

  async update(id: number, input: UpdateCategoryInput) {
    return withTransaction(async (client) => {
      const category = await categoryModel.update(id, input, client);
      if (!category) {
        throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category was not found.");
      }
      if (input.translations) {
        await categoryModel.replaceTranslations(category.id, input.translations, client);
      }
      return category;
    });
  },

  async delete(id: number) {
    const deleted = await categoryModel.delete(id);
    if (!deleted) {
      throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category was not found.");
    }
    return { deleted: true };
  }
};

