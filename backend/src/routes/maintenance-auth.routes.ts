import { Router } from "express";
import { maintenanceAuthController } from "../controllers/maintenance-auth.controller.js";
import { maintenanceAuthRateLimiter } from "../middleware/rate-limit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { maintenanceLoginSchema, maintenanceRequestPasswordResetSchema, maintenanceResetPasswordSchema } from "../validators/maintenance-auth.validator.js";

export const maintenanceAuthRoutes = Router();

maintenanceAuthRoutes.post("/login", maintenanceAuthRateLimiter, validate({ body: maintenanceLoginSchema }), asyncHandler(maintenanceAuthController.login));
maintenanceAuthRoutes.post("/logout", asyncHandler(maintenanceAuthController.logout));
maintenanceAuthRoutes.post("/refresh", maintenanceAuthRateLimiter, asyncHandler(maintenanceAuthController.refresh));
maintenanceAuthRoutes.post("/request-password-reset", maintenanceAuthRateLimiter, validate({ body: maintenanceRequestPasswordResetSchema }), asyncHandler(maintenanceAuthController.requestPasswordReset));
maintenanceAuthRoutes.post("/reset-password", maintenanceAuthRateLimiter, validate({ body: maintenanceResetPasswordSchema }), asyncHandler(maintenanceAuthController.resetPassword));
