import { pool } from "../config/db.js";

const LOW_STOCK_THRESHOLD = 10;

export interface WeeklyMonthlyTotals {
  thisWeek: number;
  thisMonth: number;
}

export interface TopProductRow {
  id: number;
  name: string;
  slug: string;
  price: string;
  units_sold: number;
  revenue: string;
}

export interface LowStockRow {
  id: number;
  name: string;
  slug: string;
  stock_quantity: number;
  price: string;
}

export const analyticsModel = {
  async revenue(): Promise<WeeklyMonthlyTotals> {
    const result = await pool.query<{ this_week: string; this_month: string }>(
      `SELECT
        COALESCE(SUM(total) FILTER (WHERE created_at >= date_trunc('week', NOW())), 0)::numeric(12,2) AS this_week,
        COALESCE(SUM(total) FILTER (WHERE created_at >= date_trunc('month', NOW())), 0)::numeric(12,2) AS this_month
      FROM orders
      WHERE status NOT IN ('cancelled', 'refunded')`
    );

    const row = result.rows[0];
    return {
      thisWeek: Number(row?.this_week ?? 0),
      thisMonth: Number(row?.this_month ?? 0)
    };
  },

  async orderVolume(): Promise<WeeklyMonthlyTotals> {
    const result = await pool.query<{ this_week: string; this_month: string }>(
      `SELECT
        COUNT(*) FILTER (WHERE created_at >= date_trunc('week', NOW()))::int AS this_week,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::int AS this_month
      FROM orders
      WHERE status NOT IN ('cancelled', 'refunded')`
    );

    const row = result.rows[0];
    return {
      thisWeek: Number(row?.this_week ?? 0),
      thisMonth: Number(row?.this_month ?? 0)
    };
  },

  async topProducts(limit = 5): Promise<TopProductRow[]> {
    const result = await pool.query<TopProductRow>(
      `SELECT p.id, p.name, p.slug, p.price::numeric(12,2) AS price,
        SUM(oi.quantity)::int AS units_sold,
        SUM(oi.quantity * oi.unit_price)::numeric(12,2) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE o.status NOT IN ('cancelled', 'refunded')
      GROUP BY p.id
      ORDER BY units_sold DESC
      LIMIT $1`,
      [limit]
    );

    return result.rows;
  },

  async lowStock(limit = 10): Promise<LowStockRow[]> {
    const result = await pool.query<LowStockRow>(
      `SELECT id, name, slug, stock_quantity, price::numeric(12,2) AS price
      FROM products
      WHERE is_active = true AND stock_quantity < $1
      ORDER BY stock_quantity ASC
      LIMIT $2`,
      [LOW_STOCK_THRESHOLD, limit]
    );

    return result.rows;
  },

  async recentOrders(limit = 5) {
    const result = await pool.query(
      `SELECT id, customer_name, customer_email, status, total::numeric(12,2) AS total, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
};
