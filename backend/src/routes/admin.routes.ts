import { Router } from "express";
import { adminController } from "../controllers/admin.controller.js";
import { requireAdminAuth } from "../middleware/admin-auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { paginationQuerySchema } from "../validators/common.validator.js";
import { reviewStatusQuerySchema } from "../validators/review.validator.js";

export const adminRoutes = Router();

adminRoutes.get("/analytics/overview", requireAdminAuth, requireRole("super_admin", "staff"), asyncHandler(adminController.overview));
adminRoutes.get("/customers", requireAdminAuth, requireRole("super_admin", "staff"), validate({ query: paginationQuerySchema }), asyncHandler(adminController.customers));
adminRoutes.get("/reviews", requireAdminAuth, requireRole("super_admin", "staff"), validate({ query: reviewStatusQuerySchema }), asyncHandler(adminController.reviews));

