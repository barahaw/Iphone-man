import { withTransaction } from "../config/db.js";
import { couponModel } from "../models/coupon.model.js";
import { orderModel } from "../models/order.model.js";
import { productModel } from "../models/product.model.js";
import { ApiError } from "../utils/api-error.js";
import { getPagination } from "../utils/pagination.js";
import type { orderListQuerySchema } from "../validators/order.validator.js";
import type { z } from "zod";

type OrderListQuery = z.infer<typeof orderListQuerySchema>;

export const ORDER_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["processing", "cancelled", "refunded"],
  processing: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: []
};

const STOCK_RESTORING_STATUSES: readonly string[] = ["cancelled", "refunded"];

export const orderService = {
  async findConfirmation(id: number, email: string) {
    // The model query filters on BOTH id and email, so a nonexistent order and a
    // mismatched email both return null here and surface as the identical generic
    // 404 ORDER_NOT_FOUND below — deliberately no 403, to prevent enumeration.
    const order = await orderModel.findConfirmation(id, email);
    if (!order) {
      throw new ApiError(404, "ORDER_NOT_FOUND", "Order confirmation was not found.");
    }
    return order;
  },

  async list(query: OrderListQuery) {
    const pagination = getPagination(query);
    const result = await orderModel.list(query.status, pagination.limit, pagination.offset);
    return {
      orders: result.rows,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        hasMore: pagination.offset + result.rows.length < result.total
      }
    };
  },

  async findById(id: number) {
    const order = await orderModel.findById(id);
    if (!order) {
      throw new ApiError(404, "ORDER_NOT_FOUND", "Order was not found.");
    }
    return order;
  },

  async updateStatus(id: number, status: string) {
    return withTransaction(async (client) => {
      const order = await orderModel.findByIdForUpdate(id, client);
      if (!order) {
        throw new ApiError(404, "ORDER_NOT_FOUND", "Order was not found.");
      }

      const currentStatus: string = order.status;
      const allowedTargets = ORDER_STATUS_TRANSITIONS[currentStatus];

      if (!allowedTargets || status === currentStatus || !allowedTargets.includes(status)) {
        throw new ApiError(
          409,
          "INVALID_STATUS_TRANSITION",
          `Cannot transition order from '${currentStatus}' to '${status}'.`,
          { from: currentStatus, to: status }
        );
      }

      if (STOCK_RESTORING_STATUSES.includes(status)) {
        const items = await orderModel.findItemStockRows(id, client);
        for (const item of items) {
          await productModel.incrementStock(item.product_id, item.variant_id, item.quantity, client);
        }

        if (order.coupon_code) {
          await couponModel.decrementUsage(order.coupon_code, client);
        }
      }

      const updated = await orderModel.updateStatus(id, status, currentStatus, client);
      if (!updated) {
        throw new ApiError(409, "ORDER_STATUS_CONFLICT", "Order status was modified concurrently.");
      }
      return updated;
    });
  },

  async listDerivedCustomers(page?: number, limit?: number) {
    const pagination = getPagination({ page, limit });
    return orderModel.listDerivedCustomers(pagination.limit, pagination.offset);
  }
};

