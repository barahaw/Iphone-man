import { Router } from "express";
import { maintenanceJobController } from "../controllers/maintenance-job.controller.js";
import { requireMaintenanceAuth } from "../middleware/maintenance-auth.middleware.js";
import { requireMaintenanceRole } from "../middleware/maintenance-rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  createMaintenanceJobSchema,
  maintenanceExportQuerySchema,
  maintenanceJobParamsSchema,
  maintenanceJobQuerySchema,
  updateMaintenanceJobSchema
} from "../validators/maintenance-job.validator.js";

export const maintenanceJobRoutes = Router();

maintenanceJobRoutes.use(requireMaintenanceAuth);

maintenanceJobRoutes.get("/", validate({ query: maintenanceJobQuerySchema }), asyncHandler(maintenanceJobController.list));
maintenanceJobRoutes.get("/export", requireMaintenanceRole("admin"), validate({ query: maintenanceExportQuerySchema }), asyncHandler(maintenanceJobController.export));
maintenanceJobRoutes.post("/", validate({ body: createMaintenanceJobSchema }), asyncHandler(maintenanceJobController.create));
maintenanceJobRoutes.get("/:id", validate({ params: maintenanceJobParamsSchema }), asyncHandler(maintenanceJobController.findById));
maintenanceJobRoutes.patch("/:id", requireMaintenanceRole("admin"), validate({ params: maintenanceJobParamsSchema, body: updateMaintenanceJobSchema }), asyncHandler(maintenanceJobController.update));
maintenanceJobRoutes.delete("/:id", requireMaintenanceRole("admin"), validate({ params: maintenanceJobParamsSchema }), asyncHandler(maintenanceJobController.delete));
