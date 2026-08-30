import { pool, type DbClient } from "../config/db.js";

export interface MaintenanceRefreshTokenRow {
  id: number;
  maintenance_user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export const maintenanceRefreshTokenModel = {
  async create(
    maintenanceUserId: number,
    tokenHash: string,
    expiresAt: Date,
    client: DbClient = pool
  ): Promise<MaintenanceRefreshTokenRow> {
    const result = await client.query<MaintenanceRefreshTokenRow>(
      `INSERT INTO maintenance_refresh_tokens (maintenance_user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [maintenanceUserId, tokenHash, expiresAt]
    );
    return result.rows[0]!;
  },

  async findByHash(tokenHash: string): Promise<MaintenanceRefreshTokenRow | null> {
    const result = await pool.query<MaintenanceRefreshTokenRow>(
      `SELECT * FROM maintenance_refresh_tokens WHERE token_hash = $1`,
      [tokenHash]
    );
    return result.rows[0] ?? null;
  },

  async revoke(id: number, client: DbClient = pool): Promise<boolean> {
    const result = await client.query(
      `UPDATE maintenance_refresh_tokens SET revoked_at = NOW()
      WHERE id = $1 AND revoked_at IS NULL`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async revokeByHash(tokenHash: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE maintenance_refresh_tokens SET revoked_at = NOW()
      WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async revokeAllForUser(maintenanceUserId: number): Promise<number> {
    const result = await pool.query(
      `UPDATE maintenance_refresh_tokens SET revoked_at = NOW()
      WHERE maintenance_user_id = $1 AND revoked_at IS NULL`,
      [maintenanceUserId]
    );
    return result.rowCount ?? 0;
  }
};
