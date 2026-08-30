import type { Request, Response } from "express";
import { productService } from "../services/product.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type { Locale } from "../validators/common.validator.js";
import type { CreateProductInput, ProductListQuery, UpdateProductInput } from "../validators/product.validator.js";

export const productController = {
  async list(req: Request, res: Response) {
    const result = await productService.list(req.validated?.query as ProductListQuery);
    sendSuccess(res, result.products, 200, result.meta);
  },

  async findBySlug(req: Request, res: Response) {
    const product = await productService.findBySlug(
      (req.validated?.params as { slug: string }).slug,
      (req.validated?.query as { locale?: Locale } | undefined)?.locale ?? "en"
    );
    sendSuccess(res, product);
  },

  async create(req: Request, res: Response) {
    const product = await productService.create(req.validated?.body as CreateProductInput);
    sendSuccess(res, product, 201);
  },

  async update(req: Request, res: Response) {
    const product = await productService.update(
      (req.validated?.params as { id: number }).id,
      req.validated?.body as UpdateProductInput
    );
    sendSuccess(res, product);
  },

  async delete(req: Request, res: Response) {
    const result = await productService.delete((req.validated?.params as { id: number }).id);
    sendSuccess(res, result);
  }
};

