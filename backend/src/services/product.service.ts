import { withTransaction } from "../config/db.js";
import { productModel } from "../models/product.model.js";
import { ApiError } from "../utils/api-error.js";
import { getPagination } from "../utils/pagination.js";
import type { Locale } from "../validators/common.validator.js";
import type { CreateProductInput, ProductListQuery, UpdateProductInput } from "../validators/product.validator.js";

export const productService = {
  async list(filters: ProductListQuery) {
    const pagination = getPagination(filters);
    const result = await productModel.list(filters, pagination.limit, pagination.offset);
    return {
      products: result.rows,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        hasMore: pagination.offset + result.rows.length < result.total
      }
    };
  },

  async findBySlug(slug: string, locale: Locale = "en") {
    const product = await productModel.findBySlug(slug, locale);
    if (!product) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
    }
    return product;
  },

  async create(input: CreateProductInput) {
    return withTransaction(async (client) => {
      const product = await productModel.create(input, client);
      await productModel.replaceTranslations(product.id, input.translations, client);
      return product;
    });
  },

  async update(id: number, input: UpdateProductInput) {
    return withTransaction(async (client) => {
      const product = await productModel.update(id, input, client);
      if (!product) {
        throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
      }

      if (input.translations) {
        await productModel.replaceTranslations(product.id, input.translations, client);
      }

      return product;
    });
  },

  async delete(id: number) {
    const deleted = await productModel.delete(id);
    if (!deleted) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
    }
    return { deleted: true };
  }
};

