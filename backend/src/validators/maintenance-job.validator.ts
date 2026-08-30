import { z } from "zod";
import { idParamSchema, paginationQuerySchema } from "./common.validator.js";

export const createMaintenanceJobSchema = z.object({
  workerId: z.number().int().positive().optional(),
  deviceType: z.string().min(1),
  partType: z.string().min(1),
  costPrice: z.number().nonnegative(),
  customerPrice: z.number().nonnegative(),
  percentage: z.number().min(0).max(100).default(0)
});

export const updateMaintenanceJobSchema = z.object({
  workerId: z.number().int().positive().optional(),
  deviceType: z.string().min(1).optional(),
  partType: z.string().min(1).optional(),
  costPrice: z.number().nonnegative().optional(),
  customerPrice: z.number().nonnegative().optional(),
  percentage: z.number().min(0).max(100).optional()
});

export const maintenanceJobQuerySchema = paginationQuerySchema.extend({
  month: z.string().regex(/^\d{4}-\d{2}$/, "month must be in YYYY-MM format").optional()
});

export const maintenanceJobParamsSchema = idParamSchema;

export const maintenanceExportQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "month must be in YYYY-MM format")
});

export type CreateMaintenanceJobInput = z.infer<typeof createMaintenanceJobSchema>;
export type UpdateMaintenanceJobInput = z.infer<typeof updateMaintenanceJobSchema>;
export type MaintenanceJobQuery = z.infer<typeof maintenanceJobQuerySchema>;
