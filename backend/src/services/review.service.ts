import { orderModel } from "../models/order.model.js";
import { reviewModel } from "../models/review.model.js";
import { ApiError } from "../utils/api-error.js";
import type { CreateReviewInput } from "../validators/review.validator.js";

export const reviewService = {
  async create(input: CreateReviewInput) {
    const verified = await orderModel.hasCompletedOrderForProduct(input.reviewerEmail, input.productId);
    if (!verified) {
      throw new ApiError(403, "REVIEW_NOT_VERIFIED", "Review must match a completed guest order email.");
    }

    return reviewModel.create(input);
  },

  listByProduct(productId: number) {
    return reviewModel.listByProduct(productId);
  },

  listForAdmin(status?: string) {
    return reviewModel.listForAdmin(status);
  },

  async updateStatus(id: number, status: string) {
    const review = await reviewModel.updateStatus(id, status);
    if (!review) {
      throw new ApiError(404, "REVIEW_NOT_FOUND", "Review was not found.");
    }

    await reviewModel.refreshProductRating(review.product_id);
    return review;
  }
};

