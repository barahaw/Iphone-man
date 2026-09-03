import { pool } from "../config/db.js";
import type { CreateReviewInput } from "../validators/review.validator.js";

export interface PublicReviewRow {
  id: number;
  product_id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  created_at: Date;
}

export const reviewModel = {
  async create(input: CreateReviewInput) {
    const result = await pool.query(
      `INSERT INTO reviews (product_id, reviewer_name, reviewer_email, rating, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [input.productId, input.reviewerName, input.reviewerEmail, input.rating, input.comment]
    );
    return result.rows[0];
  },

  async listByProduct(productId: number): Promise<PublicReviewRow[]> {
    const result = await pool.query<PublicReviewRow>(
      `SELECT id, product_id, reviewer_name, rating, comment, status, created_at
      FROM reviews
      WHERE product_id = $1 AND status = 'approved'
      ORDER BY created_at DESC`,
      [productId]
    );
    return result.rows;
  },

  async listForAdmin(status?: string) {
    const whereSql = status ? "WHERE r.status = $1" : "";
    const values: unknown[] = status ? [status] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await pool.query<any[]>(
      `SELECT r.id, r.product_id, r.reviewer_name, r.reviewer_email, r.rating, r.comment,
        r.status, r.created_at, p.name AS product_name, p.slug AS product_slug
      FROM reviews r
      JOIN products p ON p.id = r.product_id
      ${whereSql}
      ORDER BY r.created_at DESC`,
      values
    );
    return result.rows;
  },

  async updateStatus(id: number, status: string) {
    const result = await pool.query(
      "UPDATE reviews SET status = $2 WHERE id = $1 RETURNING *",
      [id, status]
    );
    return result.rows[0] ?? null;
  },

  async refreshProductRating(productId: number) {
    await pool.query(
      `UPDATE products
      SET rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM reviews
        WHERE product_id = $1 AND status = 'approved'
      ), 0)
      WHERE id = $1`,
      [productId]
    );
  }
};

