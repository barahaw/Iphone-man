import { pool } from "../config/db.js";

export interface CartOwnershipRow {
  id: number;
  session_id: string;
}

export interface PublicCartRow {
  id: number;
  created_at: Date;
}

export interface PublicCartItemRow {
  id: number;
  cart_id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  name: string;
  price: string;
  images: string[];
}

export interface PublicCartWithItems extends PublicCartRow {
  items: PublicCartItemRow[];
}

const CART_ITEMS_SELECT = `
      SELECT ci.id, ci.cart_id, ci.product_id, ci.variant_id, ci.quantity,
             p.name, p.price, p.images
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = $1
      ORDER BY ci.id ASC`;

export const cartModel = {
  async create(sessionId: string): Promise<PublicCartRow> {
    const result = await pool.query<PublicCartRow>(
      `INSERT INTO carts (session_id)
      VALUES ($1)
      ON CONFLICT (session_id) DO UPDATE SET session_id = EXCLUDED.session_id
      RETURNING id, created_at`,
      [sessionId]
    );
    return result.rows[0];
  },

  async getOwnership(cartId: number): Promise<CartOwnershipRow | null> {
    const result = await pool.query<CartOwnershipRow>(
      "SELECT id, session_id FROM carts WHERE id = $1",
      [cartId]
    );
    return result.rows[0] ?? null;
  },

  async findById(id: number): Promise<PublicCartWithItems | null> {
    const cart = await pool.query<PublicCartRow>(
      "SELECT id, created_at FROM carts WHERE id = $1",
      [id]
    );
    const items = await pool.query<PublicCartItemRow>(CART_ITEMS_SELECT, [id]);

    return cart.rows[0] ? { ...cart.rows[0], items: items.rows } : null;
  },

  async upsertItem(
    cartId: number,
    productId: number,
    variantId: number | null | undefined,
    quantity: number
  ): Promise<PublicCartWithItems | null> {
    if (quantity === 0) {
      await pool.query(
        `DELETE FROM cart_items
        WHERE cart_id = $1 AND product_id = $2 AND variant_id IS NOT DISTINCT FROM $3`,
        [cartId, productId, variantId ?? null]
      );
      return this.findById(cartId);
    }

    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (cart_id, product_id, variant_id)
      DO UPDATE SET quantity = EXCLUDED.quantity`,
      [cartId, productId, variantId ?? null, quantity]
    );

    return this.findById(cartId);
  },

  async deleteItem(cartId: number, itemId: number) {
    const result = await pool.query("DELETE FROM cart_items WHERE cart_id = $1 AND id = $2", [cartId, itemId]);
    return (result.rowCount ?? 0) > 0;
  }
};
