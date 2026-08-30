import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const adminRequestPasswordResetSchema = z.object({
  email: z.string().email()
});

export const adminResetPasswordSchema = z.object({
  resetToken: z.string().min(8),
  newPassword: z.string().min(8)
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminRequestPasswordResetInput = z.infer<typeof adminRequestPasswordResetSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;

