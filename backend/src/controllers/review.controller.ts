import type { Request, Response } from "express";
import { reviewService } from "../services/review.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type { CreateReviewInput } from "../validators/review.validator.js";

export const reviewController = {
  async create(req: Request, res: Response) {
    sendSuccess(res, await reviewService.create(req.validated?.body as CreateReviewInput), 201);
  },

  async list(req: Request, res: Response) {
    sendSuccess(res, await reviewService.listByProduct((req.validated?.query as { product_id: number }).product_id));
  },

  async updateStatus(req: Request, res: Response) {
    const params = req.validated?.params as { id: number };
    const body = req.validated?.body as { status: string };
    sendSuccess(res, await reviewService.updateStatus(params.id, body.status));
  }
};

