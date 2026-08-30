import type { Request, Response } from "express";
import { searchService } from "../services/search.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type { SearchQuery } from "../validators/search.validator.js";

export const searchController = {
  async search(req: Request, res: Response) {
    const result = await searchService.search(req.validated?.query as SearchQuery);
    sendSuccess(res, result.products, 200, result.meta);
  }
};
