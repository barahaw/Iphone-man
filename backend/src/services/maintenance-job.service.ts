import ExcelJS from "exceljs";
import { maintenanceJobModel } from "../models/maintenance-job.model.js";
import { ApiError } from "../utils/api-error.js";
import { getPagination } from "../utils/pagination.js";
import type {
  CreateMaintenanceJobInput,
  MaintenanceJobQuery,
  UpdateMaintenanceJobInput
} from "../validators/maintenance-job.validator.js";

export interface MaintenanceActor {
  id: number;
  role: "admin" | "worker";
}

function computeNetAmount(customerPrice: number, costPrice: number): number {
  return Math.max(0, customerPrice - costPrice);
}

function computeNetProfit(netAmount: number, percentage: number): number {
  return Math.max(0, netAmount - (netAmount * percentage) / 100);
}

interface MonthlyExport {
  month: string;
  filename: string;
  buffer: Buffer;
}

export const maintenanceJobService = {
  async create(input: CreateMaintenanceJobInput, actor: MaintenanceActor) {
    if (actor.role === "worker" && input.workerId !== undefined && input.workerId !== actor.id) {
      throw new ApiError(403, "MAINTENANCE_FORBIDDEN", "A worker can only create jobs for themselves.");
    }

    const workerId = input.workerId ?? actor.id;
    const netAmount = computeNetAmount(input.customerPrice, input.costPrice);
    const netProfit = computeNetProfit(netAmount, input.percentage);

    return maintenanceJobModel.create({
      workerId,
      deviceType: input.deviceType,
      partType: input.partType,
      costPrice: input.costPrice,
      customerPrice: input.customerPrice,
      percentage: input.percentage,
      netAmount,
      netProfit
    });
  },

  async list(query: MaintenanceJobQuery, actor: MaintenanceActor) {
    const pagination = getPagination(query);
    const result = await maintenanceJobModel.list(
      {
        workerId: actor.role === "worker" ? actor.id : undefined,
        month: query.month
      },
      pagination.limit,
      pagination.offset
    );

    return {
      jobs: result.rows,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        hasMore: pagination.offset + result.rows.length < result.total
      }
    };
  },

  async findById(id: number, actor: MaintenanceActor) {
    const job = await maintenanceJobModel.findById(id);
    if (!job) {
      throw new ApiError(404, "MAINTENANCE_JOB_NOT_FOUND", "Maintenance job was not found.");
    }

    if (actor.role === "worker" && job.worker_id !== actor.id) {
      throw new ApiError(403, "MAINTENANCE_FORBIDDEN", "A worker can only view their own jobs.");
    }

    return job;
  },

  async update(id: number, input: UpdateMaintenanceJobInput) {
    const current = await maintenanceJobModel.findById(id);
    if (!current) {
      throw new ApiError(404, "MAINTENANCE_JOB_NOT_FOUND", "Maintenance job was not found.");
    }

    const costPrice = input.costPrice ?? Number(current.cost_price);
    const customerPrice = input.customerPrice ?? Number(current.customer_price);
    const percentage = input.percentage ?? Number(current.percentage);
    const netAmount = computeNetAmount(customerPrice, costPrice);
    const netProfit = computeNetProfit(netAmount, percentage);

    return maintenanceJobModel.update(id, {
      workerId: input.workerId,
      deviceType: input.deviceType,
      partType: input.partType,
      costPrice,
      customerPrice,
      percentage,
      netAmount,
      netProfit
    });
  },

  async delete(id: number) {
    const deleted = await maintenanceJobModel.delete(id);
    if (!deleted) {
      throw new ApiError(404, "MAINTENANCE_JOB_NOT_FOUND", "Maintenance job was not found.");
    }
    return { deleted: true };
  },

  async exportMonthly(month: string, actor: MaintenanceActor): Promise<MonthlyExport> {
    if (actor.role !== "admin") {
      throw new ApiError(403, "MAINTENANCE_FORBIDDEN", "Only a maintenance admin can export jobs.");
    }

    const jobs = await maintenanceJobModel.listMonthly(month);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Maintenance ${month}`);

    sheet.columns = [
      { header: "Job ID", key: "id", width: 10 },
      { header: "Worker", key: "worker_name", width: 20 },
      { header: "Worker Email", key: "worker_email", width: 26 },
      { header: "Device Type", key: "device_type", width: 22 },
      { header: "Part Type", key: "part_type", width: 22 },
      { header: "Cost Price", key: "cost_price", width: 14 },
      { header: "Customer Price", key: "customer_price", width: 16 },
      { header: "Percentage (%)", key: "percentage", width: 14 },
      { header: "Net Amount", key: "net_amount", width: 14 },
      { header: "Net Profit", key: "net_profit", width: 14 },
      { header: "Created At", key: "created_at", width: 24 }
    ];

    for (const job of jobs) {
      sheet.addRow({
        id: job.id,
        worker_name: job.worker_name,
        worker_email: job.worker_email,
        device_type: job.device_type,
        part_type: job.part_type,
        cost_price: Number(job.cost_price),
        customer_price: Number(job.customer_price),
        percentage: Number(job.percentage),
        net_amount: Number(job.net_amount),
        net_profit: Number(job.net_profit),
        created_at: new Date(job.created_at)
      });
    }

    const totals = jobs.reduce(
      (acc, job) => ({
        netAmount: acc.netAmount + Number(job.net_amount),
        netProfit: acc.netProfit + Number(job.net_profit)
      }),
      { netAmount: 0, netProfit: 0 }
    );

    sheet.addRow({});
    sheet.addRow({
      id: "TOTAL",
      device_type: `${jobs.length} job(s)`,
      net_amount: totals.netAmount,
      net_profit: totals.netProfit
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      month,
      filename: `maintenance-jobs-${month}.xlsx`,
      buffer: Buffer.from(buffer)
    };
  }
};
