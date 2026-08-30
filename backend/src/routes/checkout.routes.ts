import { Router } from "express";
import { checkoutController } from "../controllers/checkout.controller.js";
import { checkoutRateLimiter } from "../middleware/rate-limit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { checkoutSchema } from "../validators/checkout.validator.js";

export const checkoutRoutes = Router();

checkoutRoutes.post("/", checkoutRateLimiter, validate({ body: checkoutSchema }), asyncHandler(checkoutController.checkout));

