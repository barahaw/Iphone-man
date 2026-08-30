import { Router } from "express";
import { couponController } from "../controllers/coupon.controller.js";
import { requireAdminAuth } from "../middleware/admin-auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { idParamSchema } from "../validators/common.validator.js";
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from "../validators/coupon.validator.js";

export const couponRoutes = Router();

couponRoutes.post("/validate", validate({ body: validateCouponSchema }), asyncHandler(couponController.validate));
couponRoutes.get("/", requireAdminAuth, requireRole("super_admin", "staff"), asyncHandler(couponController.list));
couponRoutes.post("/", requireAdminAuth, requireRole("super_admin", "staff"), validate({ body: createCouponSchema }), asyncHandler(couponController.create));
couponRoutes.patch("/:id", requireAdminAuth, requireRole("super_admin", "staff"), validate({ params: idParamSchema, body: updateCouponSchema }), asyncHandler(couponController.update));
couponRoutes.delete("/:id", requireAdminAuth, requireRole("super_admin"), validate({ params: idParamSchema }), asyncHandler(couponController.delete));

