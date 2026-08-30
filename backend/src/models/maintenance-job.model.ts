import { pool, type DbClient } from "../config/db.js";

export interface MaintenanceJobRow {
  id: number;
  worker_id: number;
  device_type: string;
  part_type: string;
  cost_price: string;
  customer_price: string;
  percentage: string;
  net_amount: string;
  net_profit: string;
  created_at: Date;
}

export interface CreateMaintenanceJobInput {
  workerId: number;
  deviceType: string;
  partType: string;
  costPrice: number;
  customerPrice: number;
  percentage: number;
  netAmount: number;
  netProfit: number;
}

export interface UpdateMaintenanceJobInput {
  workerId?: number;
  deviceType?: string;
  partType?: string;
  costPrice?: number;
  customerPrice?: number;
  percentage?: number;
  netAmount?: number;
  netProfit?: number;
}

export interface MaintenanceJobFilters {
  workerId?: number;
  month?: string;
}

export const maintenanceJobModel = {
  async create(input: CreateMaintenanceJobInput, client: DbClient = pool): Promise<MaintenanceJobRow> {
    const result = await client.query<MaintenanceJobRow>(
      `INSERT INTO maintenance_jobs (
        worker_id, device_type, part_type, cost_price, customer_price, percentage, net_amount, net_profit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        input.workerId,
        input.deviceType,
        input.partType,
        input.costPrice,
        input.customerPrice,
        input.percentage,
        input.netAmount,
        input.netProfit
      ]
    );
    return result.rows[0]!;
  },

  async findById(id: number, client: DbClient = pool): Promise<MaintenanceJobRow | null> {
    const result = await client.query<MaintenanceJobRow>("SELECT * FROM maintenance_jobs WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  },

  async list(filters: MaintenanceJobFilters, limit: number, offset: number) {
    const values: unknown[] = [];
    const where: string[] = [];

    if (filters.workerId !== undefined) {
      values.push(filters.workerId);
      where.push(`worker_id = $${values.length}`);
    }

    if (filters.month) {
      values.push(filters.month);
      where.push(`to_char(created_at, 'YYYY-MM') = $${values.length}`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const count = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM maintenance_jobs ${whereSql}`,
      values
    );

    values.push(limit, offset);
    const rows = await pool.query<MaintenanceJobRow>(
      `SELECT * FROM maintenance_jobs ${whereSql} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return {
      rows: rows.rows,
      total: Number(count.rows[0]?.total ?? 0)
    };
  },

  async update(id: number, input: UpdateMaintenanceJobInput, client: DbClient = pool): Promise<MaintenanceJobRow | null> {
    const current = await this.findById(id, client);
    if (!current) {
      return null;
    }

    const result = await client.query<MaintenanceJobRow>(
      `UPDATE maintenance_jobs SET
        worker_id = $2,
        device_type = $3,
        part_type = $4,
        cost_price = $5,
        customer_price = $6,
        percentage = $7,
        net_amount = $8,
        net_profit = $9
      WHERE id = $1
      RETURNING *`,
      [
        id,
        input.workerId ?? current.worker_id,
        input.deviceType ?? current.device_type,
        input.partType ?? current.part_type,
        input.costPrice ?? Number(current.cost_price),
        input.customerPrice ?? Number(current.customer_price),
        input.percentage ?? Number(current.percentage),
        input.netAmount ?? Number(current.net_amount),
        input.netProfit ?? Number(current.net_profit)
      ]
    );

    return result.rows[0] ?? null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query("DELETE FROM maintenance_jobs WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async listMonthly(month: string, workerId?: number) {
    const values: unknown[] = [month];
    let whereSql = "to_char(mj.created_at, 'YYYY-MM') = $1";

    if (workerId !== undefined) {
      values.push(workerId);
      whereSql += " AND mj.worker_id = $2";
    }

    const result = await pool.query(
      `SELECT mj.*, mu.name AS worker_name, mu.email AS worker_email
      FROM maintenance_jobs mj
      JOIN maintenance_users mu ON mu.id = mj.worker_id
      WHERE ${whereSql}
      ORDER BY mj.created_at ASC`,
      values
    );

    return result.rows;
  }
};
