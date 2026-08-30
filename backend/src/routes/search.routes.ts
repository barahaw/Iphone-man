import { Router } from "express";
import { searchController } from "../controllers/search.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { searchQuerySchema } from "../validators/search.validator.js";

export const searchRoutes = Router();

searchRoutes.get("/", validate({ query: searchQuerySchema }), asyncHandler(searchController.search));
