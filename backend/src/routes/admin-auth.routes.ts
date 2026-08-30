import { Router } from "express";
import { adminAuthController } from "../controllers/admin-auth.controller.js";
import { adminAuthRateLimiter } from "../middleware/rate-limit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { adminLoginSchema, adminRequestPasswordResetSchema, adminResetPasswordSchema } from "../validators/admin-auth.validator.js";

export const adminAuthRoutes = Router();

adminAuthRoutes.post("/login", adminAuthRateLimiter, validate({ body: adminLoginSchema }), asyncHandler(adminAuthController.login));
adminAuthRoutes.post("/logout", asyncHandler(adminAuthController.logout));
adminAuthRoutes.post("/refresh", adminAuthRateLimiter, asyncHandler(adminAuthController.refresh));
adminAuthRoutes.post("/request-password-reset", adminAuthRateLimiter, validate({ body: adminRequestPasswordResetSchema }), asyncHandler(adminAuthController.requestPasswordReset));
adminAuthRoutes.post("/reset-password", adminAuthRateLimiter, validate({ body: adminResetPasswordSchema }), asyncHandler(adminAuthController.resetPassword));

