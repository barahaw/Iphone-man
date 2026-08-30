import { Router } from "express";
import { reviewController } from "../controllers/review.controller.js";
import { requireAdminAuth } from "../middleware/admin-auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { idParamSchema } from "../validators/common.validator.js";
import { createReviewSchema, reviewQuerySchema, reviewStatusSchema } from "../validators/review.validator.js";

export const reviewRoutes = Router();

reviewRoutes.post("/", validate({ body: createReviewSchema }), asyncHandler(reviewController.create));
reviewRoutes.get("/", validate({ query: reviewQuerySchema }), asyncHandler(reviewController.list));
reviewRoutes.patch("/:id/status", requireAdminAuth, requireRole("super_admin", "staff"), validate({ params: idParamSchema, body: reviewStatusSchema }), asyncHandler(reviewController.updateStatus));

