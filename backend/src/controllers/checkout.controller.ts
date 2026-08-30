import type { Request, Response } from "express";
import { checkoutService } from "../services/checkout.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type { CheckoutInput } from "../validators/checkout.validator.js";

export const checkoutController = {
  async checkout(req: Request, res: Response) {
    const order = await checkoutService.checkout(req.validated?.body as CheckoutInput);
    sendSuccess(res, order, 201);
  }
};

