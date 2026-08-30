import { pool, type DbClient } from "../config/db.js";

export interface AdminRefreshTokenRow {
  id: number;
  admin_user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export const adminRefreshTokenModel = {
  async create(
    adminUserId: number,
    tokenHash: string,
    expiresAt: Date,
    client: DbClient = pool
  ): Promise<AdminRefreshTokenRow> {
    const result = await client.query<AdminRefreshTokenRow>(
      `INSERT INTO admin_refresh_tokens (admin_user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [adminUserId, tokenHash, expiresAt]
    );
    return result.rows[0]!;
  },

  async findByHash(tokenHash: string): Promise<AdminRefreshTokenRow | null> {
    const result = await pool.query<AdminRefreshTokenRow>(
      `SELECT * FROM admin_refresh_tokens WHERE token_hash = $1`,
      [tokenHash]
    );
    return result.rows[0] ?? null;
  },

  async revoke(id: number, client: DbClient = pool): Promise<boolean> {
    const result = await client.query(
      `UPDATE admin_refresh_tokens SET revoked_at = NOW()
      WHERE id = $1 AND revoked_at IS NULL`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async revokeByHash(tokenHash: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE admin_refresh_tokens SET revoked_at = NOW()
      WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async revokeAllForUser(adminUserId: number): Promise<number> {
    const result = await pool.query(
      `UPDATE admin_refresh_tokens SET revoked_at = NOW()
      WHERE admin_user_id = $1 AND revoked_at IS NULL`,
      [adminUserId]
    );
    return result.rowCount ?? 0;
  }
};
