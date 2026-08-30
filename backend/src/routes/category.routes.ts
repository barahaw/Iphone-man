import { Router } from "express";
import { categoryController } from "../controllers/category.controller.js";
import { requireAdminAuth } from "../middleware/admin-auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { idParamSchema, localeQuerySchema } from "../validators/common.validator.js";
import { createCategorySchema, updateCategorySchema } from "../validators/category.validator.js";

export const categoryRoutes = Router();

categoryRoutes.get("/", validate({ query: localeQuerySchema }), asyncHandler(categoryController.list));
categoryRoutes.post("/", requireAdminAuth, requireRole("super_admin", "staff"), validate({ body: createCategorySchema }), asyncHandler(categoryController.create));
categoryRoutes.patch("/:id", requireAdminAuth, requireRole("super_admin", "staff"), validate({ params: idParamSchema, body: updateCategorySchema }), asyncHandler(categoryController.update));
categoryRoutes.delete("/:id", requireAdminAuth, requireRole("super_admin"), validate({ params: idParamSchema }), asyncHandler(categoryController.delete));

