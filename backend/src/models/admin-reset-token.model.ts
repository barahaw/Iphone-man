import { pool, type DbClient } from "../config/db.js";

export interface AdminResetTokenRow {
  id: number;
  admin_user_id: number;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export const adminResetTokenModel = {
  async create(adminUserId: number, tokenHash: string, expiresAt: Date): Promise<AdminResetTokenRow> {
    const result = await pool.query<AdminResetTokenRow>(
      `INSERT INTO admin_password_reset_tokens (admin_user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [adminUserId, tokenHash, expiresAt]
    );
    return result.rows[0]!;
  },

  async findValidByHash(tokenHash: string): Promise<AdminResetTokenRow | null> {
    const result = await pool.query<AdminResetTokenRow>(
      `SELECT * FROM admin_password_reset_tokens
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );
    return result.rows[0] ?? null;
  },

  async markUsed(id: number, client: DbClient = pool): Promise<boolean> {
    const result = await client.query(
      `UPDATE admin_password_reset_tokens SET used_at = NOW()
      WHERE id = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
};
