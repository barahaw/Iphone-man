import { z } from "zod";

export const maintenanceLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const maintenanceRequestPasswordResetSchema = z.object({
  email: z.string().email()
});

export const maintenanceResetPasswordSchema = z.object({
  resetToken: z.string().min(8),
  newPassword: z.string().min(8)
});

export type MaintenanceLoginInput = z.infer<typeof maintenanceLoginSchema>;
export type MaintenanceRequestPasswordResetInput = z.infer<typeof maintenanceRequestPasswordResetSchema>;
export type MaintenanceResetPasswordInput = z.infer<typeof maintenanceResetPasswordSchema>;
