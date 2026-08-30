import { Router } from "express";
import { orderController } from "../controllers/order.controller.js";
import { requireAdminAuth } from "../middleware/admin-auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { orderConfirmationRateLimiter } from "../middleware/rate-limit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { idParamSchema } from "../validators/common.validator.js";
import { confirmationParamsSchema, confirmationQuerySchema } from "../validators/checkout.validator.js";
import { orderListQuerySchema, orderStatusSchema } from "../validators/order.validator.js";

export const orderRoutes = Router();

orderRoutes.get("/:id/confirmation", orderConfirmationRateLimiter, validate({ params: confirmationParamsSchema, query: confirmationQuerySchema }), asyncHandler(orderController.confirmation));
orderRoutes.get("/", requireAdminAuth, requireRole("super_admin", "staff"), validate({ query: orderListQuerySchema }), asyncHandler(orderController.list));
orderRoutes.get("/:id", requireAdminAuth, requireRole("super_admin", "staff"), validate({ params: idParamSchema }), asyncHandler(orderController.findById));
orderRoutes.patch("/:id/status", requireAdminAuth, requireRole("super_admin", "staff"), validate({ params: idParamSchema, body: orderStatusSchema }), asyncHandler(orderController.updateStatus));

