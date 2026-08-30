import { cartModel } from "../models/cart.model.js";
import { ApiError } from "../utils/api-error.js";
import type { CreateCartInput, UpdateCartItemsInput } from "../validators/cart.validator.js";

function cartNotFoundError(): ApiError {
  return new ApiError(404, "CART_NOT_FOUND", "Cart was not found.");
}

export const cartService = {
  create(input: CreateCartInput) {
    return cartModel.create(input.sessionId);
  },

  async assertOwnership(cartId: number, sessionId: string): Promise<void> {
    const ownership = await cartModel.getOwnership(cartId);
    if (!ownership || ownership.session_id !== sessionId) {
      throw cartNotFoundError();
    }
  },

  async findById(id: number, sessionId: string) {
    await this.assertOwnership(id, sessionId);
    const cart = await cartModel.findById(id);
    if (!cart) {
      throw cartNotFoundError();
    }
    return cart;
  },

  async updateItem(cartId: number, input: UpdateCartItemsInput, sessionId: string) {
    await this.assertOwnership(cartId, sessionId);
    const cart = await cartModel.upsertItem(cartId, input.productId, input.variantId, input.quantity);
    if (!cart) {
      throw cartNotFoundError();
    }
    return cart;
  },

  async deleteItem(cartId: number, itemId: number, sessionId: string) {
    await this.assertOwnership(cartId, sessionId);
    const deleted = await cartModel.deleteItem(cartId, itemId);
    if (!deleted) {
      throw new ApiError(404, "CART_ITEM_NOT_FOUND", "Cart item was not found.");
    }
    return { deleted: true };
  }
};
