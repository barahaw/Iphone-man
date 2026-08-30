import type { Request, Response } from "express";
import { orderService } from "../services/order.service.js";
import { sendSuccess } from "../utils/api-response.js";

export const orderController = {
  async confirmation(req: Request, res: Response) {
    const params = req.validated?.params as { id: number };
    const query = req.validated?.query as { email: string };
    sendSuccess(res, await orderService.findConfirmation(params.id, query.email));
  },

  async list(req: Request, res: Response) {
    const result = await orderService.list(req.validated?.query as Parameters<typeof orderService.list>[0]);
    sendSuccess(res, result.orders, 200, result.meta);
  },

  async findById(req: Request, res: Response) {
    sendSuccess(res, await orderService.findById((req.validated?.params as { id: number }).id));
  },

  async updateStatus(req: Request, res: Response) {
    const params = req.validated?.params as { id: number };
    const body = req.validated?.body as { status: string };
    sendSuccess(res, await orderService.updateStatus(params.id, body.status));
  }
};

