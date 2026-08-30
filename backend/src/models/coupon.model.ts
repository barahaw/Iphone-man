import { pool, type DbClient } from "../config/db.js";
import type { CreateCouponInput, UpdateCouponInput } from "../validators/coupon.validator.js";

export const couponModel = {
  async findByCode(code: string) {
    const result = await pool.query("SELECT * FROM coupons WHERE code = $1", [code.toUpperCase()]);
    return result.rows[0] ?? null;
  },

  async list() {
    const result = await pool.query("SELECT * FROM coupons ORDER BY id DESC");
    return result.rows;
  },

  async create(input: CreateCouponInput) {
    const result = await pool.query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_value, expires_at, usage_limit)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        input.code.toUpperCase(),
        input.discountType,
        input.discountValue,
        input.minOrderValue,
        input.expiresAt ?? null,
        input.usageLimit ?? null
      ]
    );
    return result.rows[0];
  },

  async update(id: number, input: UpdateCouponInput) {
    const current = await pool.query("SELECT * FROM coupons WHERE id = $1", [id]);
    const row = current.rows[0];
    if (!row) {
      return null;
    }

    const result = await pool.query(
      `UPDATE coupons
      SET code = $2, discount_type = $3, discount_value = $4, min_order_value = $5, expires_at = $6, usage_limit = $7
      WHERE id = $1
      RETURNING *`,
      [
        id,
        input.code?.toUpperCase() ?? row.code,
        input.discountType ?? row.discount_type,
        input.discountValue ?? row.discount_value,
        input.minOrderValue ?? row.min_order_value,
        input.expiresAt ?? row.expires_at,
        input.usageLimit ?? row.usage_limit
      ]
    );
    return result.rows[0] ?? null;
  },

  async delete(id: number) {
    const result = await pool.query("DELETE FROM coupons WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async incrementUsage(code: string, client: DbClient = pool) {
    const result = await client.query(
      `UPDATE coupons SET times_used = times_used + 1 WHERE code = $1 AND (usage_limit IS NULL OR times_used < usage_limit) RETURNING *`,
      [code.toUpperCase()]
    );
    return result.rows[0] ?? null;
  },

  async decrementUsage(code: string, client: DbClient = pool) {
    const result = await client.query(
      `UPDATE coupons SET times_used = GREATEST(times_used - 1, 0) WHERE code = $1 RETURNING *`,
      [code.toUpperCase()]
    );
    return result.rows[0] ?? null;
  }
};
