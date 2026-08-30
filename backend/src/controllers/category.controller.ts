import type { Request, Response } from "express";
import { categoryService } from "../services/category.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type { Locale } from "../validators/common.validator.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "../validators/category.validator.js";

export const categoryController = {
  async list(req: Request, res: Response) {
    sendSuccess(res, await categoryService.list((req.validated?.query as { locale?: Locale } | undefined)?.locale));
  },

  async create(req: Request, res: Response) {
    sendSuccess(res, await categoryService.create(req.validated?.body as CreateCategoryInput), 201);
  },

  async update(req: Request, res: Response) {
    sendSuccess(
      res,
      await categoryService.update((req.validated?.params as { id: number }).id, req.validated?.body as UpdateCategoryInput)
    );
  },

  async delete(req: Request, res: Response) {
    sendSuccess(res, await categoryService.delete((req.validated?.params as { id: number }).id));
  }
};

