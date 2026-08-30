import { Router } from "express";
import { brandController } from "../controllers/brand.controller.js";
import { requireAdminAuth } from "../middleware/admin-auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { idParamSchema, localeQuerySchema } from "../validators/common.validator.js";
import { createBrandSchema, updateBrandSchema } from "../validators/brand.validator.js";

export const brandRoutes = Router();

brandRoutes.get("/", validate({ query: localeQuerySchema }), asyncHandler(brandController.list));
brandRoutes.post("/", requireAdminAuth, requireRole("super_admin", "staff"), validate({ body: createBrandSchema }), asyncHandler(brandController.create));
brandRoutes.patch("/:id", requireAdminAuth, requireRole("super_admin", "staff"), validate({ params: idParamSchema, body: updateBrandSchema }), asyncHandler(brandController.update));
brandRoutes.delete("/:id", requireAdminAuth, requireRole("super_admin"), validate({ params: idParamSchema }), asyncHandler(brandController.delete));

