import { productModel } from "../models/product.model.js";
import { getPagination } from "../utils/pagination.js";
import type { SearchQuery } from "../validators/search.validator.js";

export const searchService = {
  async search(query: SearchQuery) {
    const pagination = getPagination(query);
    const result = await productModel.search(query.q, query.locale, pagination.limit, pagination.offset);

    return {
      products: result.rows,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        hasMore: pagination.offset + result.rows.length < result.total
      }
    };
  }
};
