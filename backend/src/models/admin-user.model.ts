import { pool, type DbClient } from "../config/db.js";

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "super_admin" | "staff";
  created_at: Date;
}

export const adminUserModel = {
  async findByEmail(email: string): Promise<AdminUserRow | null> {
    const result = await pool.query<AdminUserRow>("SELECT * FROM admin_users WHERE email = $1", [email]);
    return result.rows[0] ?? null;
  },

  async findById(id: number): Promise<AdminUserRow | null> {
    const result = await pool.query<AdminUserRow>("SELECT * FROM admin_users WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  },

  async updatePassword(email: string, passwordHash: string): Promise<AdminUserRow | null> {
    const result = await pool.query<AdminUserRow>(
      "UPDATE admin_users SET password_hash = $2 WHERE email = $1 RETURNING *",
      [email, passwordHash]
    );
    return result.rows[0] ?? null;
  },

  async updatePasswordById(id: number, passwordHash: string, client: DbClient = pool): Promise<AdminUserRow | null> {
    const result = await client.query<AdminUserRow>(
      "UPDATE admin_users SET password_hash = $2 WHERE id = $1 RETURNING *",
      [id, passwordHash]
    );
    return result.rows[0] ?? null;
  }
};

