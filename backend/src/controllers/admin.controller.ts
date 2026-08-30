import type { Request, Response } from "express";
import { analyticsService } from "../services/analytics.service.js";
import { orderService } from "../services/order.service.js";
import { sendSuccess } from "../utils/api-response.js";

export const adminController = {
  async overview(_req: Request, res: Response) {
    sendSuccess(res, await analyticsService.overview());
  },

  async customers(req: Request, res: Response) {
    const query = req.validated?.query as { page?: number; limit?: number };
    sendSuccess(res, await orderService.listDerivedCustomers(query.page, query.limit));
  }
};

