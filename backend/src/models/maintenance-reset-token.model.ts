import { pool, type DbClient } from "../config/db.js";

export interface MaintenanceResetTokenRow {
  id: number;
  maintenance_user_id: number;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export const maintenanceResetTokenModel = {
  async create(maintenanceUserId: number, tokenHash: string, expiresAt: Date): Promise<MaintenanceResetTokenRow> {
    const result = await pool.query<MaintenanceResetTokenRow>(
      `INSERT INTO maintenance_password_reset_tokens (maintenance_user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [maintenanceUserId, tokenHash, expiresAt]
    );
    return result.rows[0]!;
  },

  async findValidByHash(tokenHash: string): Promise<MaintenanceResetTokenRow | null> {
    const result = await pool.query<MaintenanceResetTokenRow>(
      `SELECT * FROM maintenance_password_reset_tokens
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );
    return result.rows[0] ?? null;
  },

  async markUsed(id: number, client: DbClient = pool): Promise<boolean> {
    const result = await client.query(
      `UPDATE maintenance_password_reset_tokens SET used_at = NOW()
      WHERE id = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
};
