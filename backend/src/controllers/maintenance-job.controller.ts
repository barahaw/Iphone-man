import type { Request, Response } from "express";
import { maintenanceJobService, type MaintenanceActor } from "../services/maintenance-job.service.js";
import { sendSuccess } from "../utils/api-response.js";
import type { CreateMaintenanceJobInput, MaintenanceJobQuery, UpdateMaintenanceJobInput } from "../validators/maintenance-job.validator.js";

function getActor(req: Request): MaintenanceActor {
  const user = req.maintenanceUser;
  return { id: user!.maintenanceUserId, role: user!.role };
}

export const maintenanceJobController = {
  async create(req: Request, res: Response) {
    const job = await maintenanceJobService.create(req.validated?.body as CreateMaintenanceJobInput, getActor(req));
    sendSuccess(res, job, 201);
  },

  async list(req: Request, res: Response) {
    const result = await maintenanceJobService.list(req.validated?.query as MaintenanceJobQuery, getActor(req));
    sendSuccess(res, result.jobs, 200, result.meta);
  },

  async findById(req: Request, res: Response) {
    const job = await maintenanceJobService.findById((req.validated?.params as { id: number }).id, getActor(req));
    sendSuccess(res, job);
  },

  async update(req: Request, res: Response) {
    const job = await maintenanceJobService.update(
      (req.validated?.params as { id: number }).id,
      req.validated?.body as UpdateMaintenanceJobInput
    );
    sendSuccess(res, job);
  },

  async delete(req: Request, res: Response) {
    sendSuccess(res, await maintenanceJobService.delete((req.validated?.params as { id: number }).id));
  },

  async export(req: Request, res: Response) {
    const result = await maintenanceJobService.exportMonthly(
      (req.validated?.query as { month: string }).month,
      getActor(req)
    );
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }
};
