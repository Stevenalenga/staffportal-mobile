import { z } from "zod";

const phoneField = z.string().max(30).optional().or(z.literal(""));

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Display name is required").max(120),
  phone: phoneField,
  secondaryPhone: phoneField,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
