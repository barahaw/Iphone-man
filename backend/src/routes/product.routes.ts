import { Router } from "express";
import { productController } from "../controllers/product.controller.js";
import { requireAdminAuth } from "../middleware/admin-auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { idParamSchema, localeQuerySchema, slugParamSchema } from "../validators/common.validator.js";
import { createProductSchema, productListQuerySchema, updateProductSchema } from "../validators/product.validator.js";

export const productRoutes = Router();

productRoutes.get("/", validate({ query: productListQuerySchema }), asyncHandler(productController.list));
productRoutes.get("/:slug", validate({ params: slugParamSchema, query: localeQuerySchema }), asyncHandler(productController.findBySlug));
productRoutes.post("/", requireAdminAuth, requireRole("super_admin", "staff"), validate({ body: createProductSchema }), asyncHandler(productController.create));
productRoutes.patch("/:id", requireAdminAuth, requireRole("super_admin", "staff"), validate({ params: idParamSchema, body: updateProductSchema }), asyncHandler(productController.update));
productRoutes.delete("/:id", requireAdminAuth, requireRole("super_admin"), validate({ params: idParamSchema }), asyncHandler(productController.delete));

