import type { Request, Response } from "express";
import { brandService } from "../services/brand.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type { Locale } from "../validators/common.validator.js";
import type { CreateBrandInput, UpdateBrandInput } from "../validators/brand.validator.js";

export const brandController = {
  async list(req: Request, res: Response) {
    sendSuccess(res, await brandService.list((req.validated?.query as { locale?: Locale } | undefined)?.locale));
  },

  async create(req: Request, res: Response) {
    sendSuccess(res, await brandService.create(req.validated?.body as CreateBrandInput), 201);
  },

  async update(req: Request, res: Response) {
    sendSuccess(
      res,
      await brandService.update((req.validated?.params as { id: number }).id, req.validated?.body as UpdateBrandInput)
    );
  },

  async delete(req: Request, res: Response) {
    sendSuccess(res, await brandService.delete((req.validated?.params as { id: number }).id));
  }
};

