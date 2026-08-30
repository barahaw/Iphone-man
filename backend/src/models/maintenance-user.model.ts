import { pool, type DbClient } from "../config/db.js";

export interface MaintenanceUserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "worker";
  created_at: Date;
}

export const maintenanceUserModel = {
  async findByEmail(email: string): Promise<MaintenanceUserRow | null> {
    const result = await pool.query<MaintenanceUserRow>("SELECT * FROM maintenance_users WHERE email = $1", [email]);
    return result.rows[0] ?? null;
  },

  async findById(id: number): Promise<MaintenanceUserRow | null> {
    const result = await pool.query<MaintenanceUserRow>("SELECT * FROM maintenance_users WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  },

  async updatePassword(email: string, passwordHash: string): Promise<MaintenanceUserRow | null> {
    const result = await pool.query<MaintenanceUserRow>(
      "UPDATE maintenance_users SET password_hash = $2 WHERE email = $1 RETURNING *",
      [email, passwordHash]
    );
    return result.rows[0] ?? null;
  },

  async updatePasswordById(id: number, passwordHash: string, client: DbClient = pool): Promise<MaintenanceUserRow | null> {
    const result = await client.query<MaintenanceUserRow>(
      "UPDATE maintenance_users SET password_hash = $2 WHERE id = $1 RETURNING *",
      [id, passwordHash]
    );
    return result.rows[0] ?? null;
  }
};
