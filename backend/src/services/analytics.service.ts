import { analyticsModel } from "../models/analytics.model.js";

export const analyticsService = {
  async overview() {
    const [revenue, orderVolume, topProducts, lowStock, recentOrders] = await Promise.all([
      analyticsModel.revenue(),
      analyticsModel.orderVolume(),
      analyticsModel.topProducts(),
      analyticsModel.lowStock(),
      analyticsModel.recentOrders()
    ]);

    return {
      revenue,
      orderVolume,
      topProducts,
      lowStock,
      recentOrders
    };
  }
};
