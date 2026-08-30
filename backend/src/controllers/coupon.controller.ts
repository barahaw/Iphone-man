import type { Request, Response } from "express";
import { couponService } from "../services/coupon.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type { CreateCouponInput, UpdateCouponInput, ValidateCouponInput } from "../validators/coupon.validator.js";

export const couponController = {
  async validate(req: Request, res: Response) {
    sendSuccess(res, await couponService.validate(req.validated?.body as ValidateCouponInput));
  },

  async list(_req: Request, res: Response) {
    sendSuccess(res, await couponService.list());
  },

  async create(req: Request, res: Response) {
    sendSuccess(res, await couponService.create(req.validated?.body as CreateCouponInput), 201);
  },

  async update(req: Request, res: Response) {
    sendSuccess(
      res,
      await couponService.update((req.validated?.params as { id: number }).id, req.validated?.body as UpdateCouponInput)
    );
  },

  async delete(req: Request, res: Response) {
    sendSuccess(res, await couponService.delete((req.validated?.params as { id: number }).id));
  }
};

