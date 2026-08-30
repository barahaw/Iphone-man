import { Router } from "express";
import { cartController } from "../controllers/cart.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { cartIdParamSchema, cartItemParamSchema, cartOwnershipQuerySchema, createCartSchema, updateCartItemsSchema } from "../validators/cart.validator.js";

export const cartRoutes = Router();

cartRoutes.post("/", validate({ body: createCartSchema }), asyncHandler(cartController.create));
cartRoutes.get("/:id", validate({ params: cartIdParamSchema, query: cartOwnershipQuerySchema }), asyncHandler(cartController.findById));
cartRoutes.patch("/:id/items", validate({ params: cartIdParamSchema, query: cartOwnershipQuerySchema, body: updateCartItemsSchema }), asyncHandler(cartController.updateItem));
cartRoutes.delete("/:id/items/:itemId", validate({ params: cartItemParamSchema, query: cartOwnershipQuerySchema }), asyncHandler(cartController.deleteItem));

