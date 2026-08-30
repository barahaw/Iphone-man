import type { Request, Response } from "express";
import { cartService } from "../services/cart.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type { CreateCartInput, UpdateCartItemsInput } from "../validators/cart.validator.js";

interface CartIdParams {
  id: number;
}

interface CartItemParams extends CartIdParams {
  itemId: number;
}

interface CartOwnershipQuery {
  sessionId: string;
}

export const cartController = {
  async create(req: Request, res: Response) {
    sendSuccess(res, await cartService.create(req.validated?.body as CreateCartInput), 201);
  },

  async findById(req: Request, res: Response) {
    const params = req.validated?.params as CartIdParams;
    const query = req.validated?.query as CartOwnershipQuery;
    sendSuccess(res, await cartService.findById(params.id, query.sessionId));
  },

  async updateItem(req: Request, res: Response) {
    const params = req.validated?.params as CartIdParams;
    const query = req.validated?.query as CartOwnershipQuery;
    sendSuccess(
      res,
      await cartService.updateItem(params.id, req.validated?.body as UpdateCartItemsInput, query.sessionId)
    );
  },

  async deleteItem(req: Request, res: Response) {
    const params = req.validated?.params as CartItemParams;
    const query = req.validated?.query as CartOwnershipQuery;
    sendSuccess(res, await cartService.deleteItem(params.id, params.itemId, query.sessionId));
  }
};
