import { pool, type DbClient } from "../config/db.js";

export interface CheckoutOrderItemInput {
  productId: number;
  variantId?: number | null;
  quantity: number;
}

export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Record<string, unknown>;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  couponCode?: string | null;
  items: Array<CheckoutOrderItemInput & { unitPrice: number }>;
}

export interface OrderItemStockRow {
  product_id: number;
  variant_id: number | null;
  quantity: number;
}

export interface PublicOrderConfirmationRow {
  id: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  subtotal: string;
  discount: string;
  shipping_fee: string;
  tax: string;
  total: string;
  created_at: Date;
  customer_email: string;
}

export const orderModel = {
  async create(input: CreateOrderInput, client: DbClient) {
    const order = await client.query(
      `INSERT INTO orders (
        customer_name, customer_email, customer_phone, shipping_address,
        subtotal, discount, shipping_fee, tax, total, coupon_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        input.customerName,
        input.customerEmail,
        input.customerPhone,
        input.shippingAddress,
        input.subtotal,
        input.discount,
        input.shippingFee,
        input.tax,
        input.total,
        input.couponCode ?? null
      ]
    );

    const orderRow = order.rows[0];
    for (const item of input.items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4, $5)`,
        [orderRow.id, item.productId, item.variantId ?? null, item.quantity, item.unitPrice]
      );
    }

    return orderRow;
  },

  async findConfirmation(id: number, email: string): Promise<PublicOrderConfirmationRow | null> {
    const result = await pool.query<PublicOrderConfirmationRow>(
      `SELECT id, status, subtotal, discount, shipping_fee, tax, total, created_at, customer_email
      FROM orders
      WHERE id = $1 AND customer_email = $2`,
      [id, email]
    );
    return result.rows[0] ?? null;
  },

  async list(status: string | undefined, limit: number, offset: number) {
    const values: unknown[] = [];
    const where: string[] = [];

    if (status) {
      values.push(status);
      where.push(`status = $${values.length}`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const count = await pool.query<{ total: string }>(`SELECT COUNT(*)::int AS total FROM orders ${whereSql}`, values);
    values.push(limit, offset);
    const rows = await pool.query(
      `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return { rows: rows.rows, total: Number(count.rows[0]?.total ?? 0) };
  },

  async findById(id: number) {
    const order = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
    const items = await pool.query("SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC", [id]);
    return order.rows[0] ? { ...order.rows[0], items: items.rows } : null;
  },

  async findByIdForUpdate(id: number, client: DbClient) {
    const result = await client.query("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [id]);
    return result.rows[0] ?? null;
  },

  async findItemStockRows(id: number, client: DbClient): Promise<OrderItemStockRow[]> {
    const result = await client.query<OrderItemStockRow>(
      "SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = $1 ORDER BY id ASC",
      [id]
    );
    return result.rows;
  },

  async updateStatus(id: number, status: string, expectedCurrentStatus: string, client: DbClient = pool) {
    const result = await client.query(
      "UPDATE orders SET status = $2 WHERE id = $1 AND status = $3 RETURNING *",
      [id, status, expectedCurrentStatus]
    );
    return result.rows[0] ?? null;
  },

  async hasCompletedOrderForProduct(email: string, productId: number) {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT 1
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.customer_email = $1
          AND oi.product_id = $2
          AND o.status IN ('processing', 'shipped', 'delivered')
      ) AS exists`,
      [email, productId]
    );
    return Boolean(result.rows[0]?.exists);
  },

  async listDerivedCustomers(limit: number, offset: number) {
    const rows = await pool.query(
      `SELECT customer_email, MAX(customer_name) AS customer_name, MAX(customer_phone) AS customer_phone,
        COUNT(*)::int AS order_count, SUM(total)::numeric(12,2) AS total_spent, MAX(created_at) AS last_order_at
      FROM orders
      GROUP BY customer_email
      ORDER BY last_order_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows.rows;
  }
};
